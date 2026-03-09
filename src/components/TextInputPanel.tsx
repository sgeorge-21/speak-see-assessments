import { useState } from "react";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

interface TextInputPanelProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
}

const TextInputPanel = ({ onSubmit, placeholder = "Type your answer here..." }: TextInputPanelProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
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
          disabled={!text.trim()}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-opacity disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default TextInputPanel;
