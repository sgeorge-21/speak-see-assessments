import { useState, useRef, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
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

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  expectedText?: string;
  onTranscriptionResult?: (result: TranscriptionResult) => void;
}

const VoiceRecorder = ({ onRecordingComplete, expectedText, onTranscriptionResult }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const transcribeAudio = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      if (expectedText) {
        formData.append("expectedText", expectedText);
      }

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: formData,
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      onTranscriptionResult?.(data as TranscriptionResult);
    } catch (err) {
      console.error("Transcription failed:", err);
      toast.error("Transcription failed. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  }, [expectedText, onTranscriptionResult]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        transcribeAudio(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      console.error("Microphone access denied");
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  }, [onRecordingComplete, transcribeAudio]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <AnimatePresence mode="wait">
        {isTranscribing ? (
          <motion.div
            key="transcribing"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-muted"
          >
            <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
          </motion.div>
        ) : isRecording ? (
          <motion.button
            key="stop"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={stopRecording}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-elevated transition-transform hover:scale-105"
          >
            <span className="absolute inset-0 rounded-full bg-destructive/30 animate-pulse-ring" />
            <Square className="h-7 w-7" />
          </motion.button>
        ) : (
          <motion.button
            key="start"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={startRecording}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105"
          >
            <Mic className="h-7 w-7" />
          </motion.button>
        )}
      </AnimatePresence>
      <p className="text-sm font-semibold text-muted-foreground">
        {isTranscribing ? (
          <span className="text-primary">Transcribing your recording...</span>
        ) : isRecording ? (
          <span className="text-destructive">{formatTime(duration)} — Recording...</span>
        ) : (
          "Tap to record"
        )}
      </p>
    </div>
  );
};

export default VoiceRecorder;
