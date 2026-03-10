import { useState, useRef } from "react";
import { Upload, Image, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TranscriptionResult {
  transcription: string;
  words_correct?: number;
  words_total?: number;
  accuracy_percentage?: number;
  errors?: Array<{ expected: string; actual: string; type: string }>;
}

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  expectedText?: string;
  onComparisonResult?: (result: TranscriptionResult) => void;
}

const ImageUploader = ({ onImageSelected, expectedText, onComparisonResult }: ImageUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!expectedText || !onComparisonResult) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("image", file, file.name);
      formData.append("expectedText", expectedText);

      const { data, error } = await supabase.functions.invoke("ocr-compare", {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      onComparisonResult(data as TranscriptionResult);
    } catch (err) {
      console.error("OCR comparison failed:", err);
      toast.error("Image comparison failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onImageSelected(file);
    processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative overflow-hidden rounded-lg border-2 border-border"
          >
            <img src={preview} alt="Uploaded" className="w-full max-h-64 object-contain bg-muted" />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-xs font-semibold text-muted-foreground">Reading image...</p>
                </div>
              </div>
            )}
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 rounded-full bg-foreground/70 p-1.5 text-background transition-colors hover:bg-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-coral-light">
              <Image className="h-6 w-6 text-coral" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drop an image or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
};

export default ImageUploader;
