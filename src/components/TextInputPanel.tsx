import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface TranscriptionResult {
  transcription: string;
  words_correct?: number;
  words_total?: number;
  accuracy_percentage?: number;
  errors?: Array<{ expected: string; actual: string; type: string }>;
}

interface TextInputPanelProps {
  onSubmit: (text: string) => void;
  expectedText?: string;
  onComparisonResult?: (result: TranscriptionResult) => void;
  placeholder?: string;
}

function compareTexts(typed: string, expected: string): TranscriptionResult {
  const normalize = (s: string) =>
    s.replace(/[^\w\s]/g, "").toLowerCase().trim();

  const expectedWords = expected
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => normalize(w));
  const typedWords = typed
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => normalize(w));

  let wordsCorrect = 0;
  const errors: TranscriptionResult["errors"] = [];

  expectedWords.forEach((ew, i) => {
    const tw = typedWords[i];
    if (!tw) {
      errors!.push({ expected: ew, actual: "[missing]", type: "omission" });
    } else if (tw === ew) {
      wordsCorrect++;
    } else {
      errors!.push({ expected: ew, actual: tw, type: "substitution" });
    }
  });

  // Extra words typed beyond expected
  if (typedWords.length > expectedWords.length) {
    for (let i = expectedWords.length; i < typedWords.length; i++) {
      errors!.push({ expected: "[none]", actual: typedWords[i], type: "addition" });
    }
  }

  const wordsTotal = expectedWords.length;
  const accuracy = wordsTotal > 0 ? Math.round((wordsCorrect / wordsTotal) * 100) : 0;

  return {
    transcription: typed,
    words_correct: wordsCorrect,
    words_total: wordsTotal,
    accuracy_percentage: accuracy,
    errors,
  };
}

const TextInputPanel = ({
  onSubmit,
  expectedText,
  onComparisonResult,
  placeholder = "Type your answer here...",
}: TextInputPanelProps) => {
  const [text, setText] = useState("");
  const [isComparing, setIsComparing] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    const trimmed = text.trim();
    onSubmit(trimmed);

    if (expectedText && onComparisonResult) {
      setIsComparing(true);
      // Simulate brief processing
      setTimeout(() => {
        const result = compareTexts(trimmed, expectedText);
        onComparisonResult(result);
        setIsComparing(false);
      }, 300);
    }

    setText("");
  };

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-lg border-2 border-border bg-card p-4 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!text.trim() || isComparing}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-opacity disabled:opacity-40"
        >
          {isComparing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default TextInputPanel;
