import { useState, useRef, useCallback } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ListenBarProps {
  text: string;
  isEgra: boolean;
}

const ListenBar = ({ text, isEgra }: ListenBarProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (!text) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    // Try to pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [text, isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        isEgra ? "bg-egra-light" : "bg-egma-light"
      }`}
    >
      <button
        onClick={speak}
        disabled={isLoading}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 ${
          isEgra ? "bg-egra text-primary-foreground" : "bg-egma text-primary-foreground"
        }`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Square className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-bold ${isEgra ? "text-egra" : "text-egma"}`}>
          {isPlaying ? "Playing..." : "Listen to this text"}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          Tap to hear how it should be read
        </p>
      </div>
    </motion.div>
  );
};

export default ListenBar;
