import { motion } from "framer-motion";
import { Trophy, Target, CheckCircle2, ArrowLeft } from "lucide-react";

interface TaskScore {
  taskTitle: string;
  wordsCorrect: number;
  wordsTotal: number;
  accuracy: number;
}

interface AssessmentScoreSummaryProps {
  scores: TaskScore[];
  isEgra: boolean;
  onGoBack: () => void;
}

const AssessmentScoreSummary = ({ scores, isEgra, onGoBack }: AssessmentScoreSummaryProps) => {
  const totalCorrect = scores.reduce((sum, s) => sum + s.wordsCorrect, 0);
  const totalWords = scores.reduce((sum, s) => sum + s.wordsTotal, 0);
  const overallAccuracy = totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0;

  const getGrade = (pct: number) => {
    if (pct >= 90) return { label: "Excellent!", emoji: "🌟", color: "text-egra" };
    if (pct >= 70) return { label: "Good Job!", emoji: "👏", color: "text-amber" };
    if (pct >= 50) return { label: "Keep Practicing", emoji: "💪", color: "text-coral" };
    return { label: "Needs Work", emoji: "📚", color: "text-destructive" };
  };

  const grade = getGrade(overallAccuracy);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Overall Score Card */}
      <div className="rounded-2xl bg-card p-8 shadow-elevated text-center">
        <div className="text-5xl mb-3">{grade.emoji}</div>
        <h2 className="text-2xl font-black text-foreground mb-1">{grade.label}</h2>
        <p className="text-sm text-muted-foreground mb-6">Assessment Complete</p>

        <div className="flex justify-center gap-6">
          <div className={`rounded-xl p-4 ${isEgra ? "bg-egra-light" : "bg-egma-light"}`}>
            <Trophy className={`h-6 w-6 mx-auto mb-1 ${isEgra ? "text-egra" : "text-egma"}`} />
            <p className={`text-3xl font-black ${isEgra ? "text-egra" : "text-egma"}`}>
              {overallAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground font-semibold">Overall</p>
          </div>
          <div className={`rounded-xl p-4 ${isEgra ? "bg-egra-light" : "bg-egma-light"}`}>
            <Target className={`h-6 w-6 mx-auto mb-1 ${isEgra ? "text-egra" : "text-egma"}`} />
            <p className={`text-3xl font-black ${isEgra ? "text-egra" : "text-egma"}`}>
              {totalCorrect}/{totalWords}
            </p>
            <p className="text-xs text-muted-foreground font-semibold">Correct</p>
          </div>
        </div>
      </div>

      {/* Per-task breakdown */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">
          Task Breakdown
        </h3>
        <div className="space-y-3">
          {scores.map((score, i) => (
            <div key={i} className="flex items-center gap-3">
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${isEgra ? "text-egra" : "text-egma"}`} />
              <span className="flex-1 text-sm font-semibold text-foreground truncate">
                {score.taskTitle}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isEgra ? "bg-egra" : "bg-egma"}`}
                    style={{ width: `${score.accuracy}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground w-10 text-right">
                  {score.accuracy}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onGoBack}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02] ${
          isEgra ? "bg-egra" : "bg-egma"
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </button>
    </motion.div>
  );
};

export default AssessmentScoreSummary;
