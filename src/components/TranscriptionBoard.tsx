import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface TranscriptionResult {
  transcription: string;
  words_correct?: number;
  words_total?: number;
  accuracy_percentage?: number;
  errors?: Array<{ expected: string; actual: string; type: string }>;
  answer?: string;
  is_answer_present?: boolean;
}

type SourceType = "voice" | "text" | "image";

interface TranscriptionBoardProps {
  result: TranscriptionResult;
  expectedText: string;
  isEgra: boolean;
  source?: SourceType;
}

const TranscriptionBoard = ({ result, expectedText, isEgra, source }: TranscriptionBoardProps) => {
  const themeColor = isEgra ? "egra" : "egma";

  // Build a map of errors by expected word (lowercase) for quick lookup
  const errorMap = new Map<string, { actual: string; type: string }>();
  result.errors?.forEach((err) => {
    errorMap.set(err.expected.toLowerCase(), { actual: err.actual, type: err.type });
  });

  // Split expected text into individual tokens
  const expectedTokens = expectedText
    .split(/\s+/)
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-5"
    >
      {/* Accuracy Stats */}
      {result.accuracy_percentage !== undefined && (
        <div className="flex gap-3">
          <div className={`flex-1 rounded-xl p-3 text-center bg-${themeColor}-light`}>
            <p className={`text-2xl font-black text-${themeColor}`}>
              {result.accuracy_percentage}%
            </p>
            <p className="text-xs text-muted-foreground font-semibold">Accuracy</p>
          </div>
          <div className={`flex-1 rounded-xl p-3 text-center bg-${themeColor}-light`}>
            <p className={`text-2xl font-black text-${themeColor}`}>
              {result.words_correct}/{result.words_total}
            </p>
            <p className="text-xs text-muted-foreground font-semibold">Correct</p>
          </div>
        </div>
      )}

      {/* Word-by-word comparison board (only when we have expected tokens) */}
      {expectedTokens.length > 0 && result.words_total !== undefined && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">
            Word-by-Word Comparison
          </h3>
          <div className="flex flex-wrap gap-2">
            {expectedTokens.map((token, i) => {
              const err = errorMap.get(token.toLowerCase());
              const isCorrect = !err;

              return (
                <div
                  key={i}
                  className={`relative group inline-flex flex-col items-center rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                    isCorrect
                      ? `bg-${themeColor}-light text-${themeColor} ring-1 ring-${themeColor}/20`
                      : "bg-destructive/10 text-destructive ring-1 ring-destructive/20"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {isCorrect ? (
                      <CheckCircle2 className="h-3 w-3 opacity-60" />
                    ) : (
                      <XCircle className="h-3 w-3 opacity-60" />
                    )}
                    {token}
                  </span>
                  {err && (
                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                      said: "{err.actual}" ({err.type})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Student answer vs expected/correct answer */}
      {(result.answer !== undefined || expectedText) && (
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">
            Answers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Student Answer</h4>
              <div className="text-sm text-foreground bg-muted rounded-lg p-3 leading-relaxed min-h-[3rem]">
                "{result.answer ?? result.transcription}"
              </div>
              {result.is_answer_present !== undefined && (
                <p className="text-xs text-muted-foreground mt-2">
                  {result.is_answer_present ? (
                    <span className="font-semibold text-foreground">Answer detected</span>
                  ) : (
                    <span className="font-semibold text-destructive">No clear answer detected</span>
                  )}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Correct / Expected Answer</h4>
              <div className="text-sm text-foreground bg-muted rounded-lg p-3 leading-relaxed min-h-[3rem]">
                "{expectedText || "—"}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full transcription / extracted answer */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">
          {source === "image" ? "What was seen" : source === "text" ? "What was typed" : "What was heard"}
        </h3>
        <p className="text-sm text-foreground bg-muted rounded-lg p-3 leading-relaxed">
          "{result.transcription}"
        </p>
      </div>
    </motion.div>
  );
};

export default TranscriptionBoard;
