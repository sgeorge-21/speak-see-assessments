import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Type, ImageIcon, ArrowLeft, CheckCircle2, BookOpen, Calculator } from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import TextInputPanel from "../components/TextInputPanel";
import ImageUploader from "../components/ImageUploader";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type InputMode = "voice" | "text" | "image";

const sampleTasks: Record<string, { title: string; prompt: string }[]> = {
  egra: [
    { title: "Letter Recognition", prompt: "Read aloud the letters shown on the screen." },
    { title: "Familiar Words", prompt: "Read these familiar words as quickly as you can." },
    { title: "Oral Reading Fluency", prompt: "Read the passage below aloud." },
    { title: "Reading Comprehension", prompt: "Answer the questions about the passage you read." },
  ],
  egma: [
    { title: "Number Identification", prompt: "Identify the numbers shown on the screen." },
    { title: "Quantity Comparison", prompt: "Which number is bigger? Say or type your answer." },
    { title: "Addition & Subtraction", prompt: "Solve the problems shown below." },
    { title: "Word Problems", prompt: "Listen to or read the word problem and provide your answer." },
  ],
};

const modeConfig: Record<InputMode, { icon: typeof Mic; label: string; color: string }> = {
  voice: { icon: Mic, label: "Voice", color: "bg-primary text-primary-foreground" },
  text: { icon: Type, label: "Text", color: "bg-egma text-primary-foreground" },
  image: { icon: ImageIcon, label: "Picture", color: "bg-coral text-primary-foreground" },
};

const AssessmentPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [currentTask, setCurrentTask] = useState(0);
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const assessmentType = type === "egma" ? "egma" : "egra";
  const tasks = sampleTasks[assessmentType];
  const task = tasks[currentTask];
  const isEgra = assessmentType === "egra";

  const handleSubmission = (data: string | Blob | File) => {
    toast.success(`Response recorded for "${task.title}"`);
    setCompletedTasks((prev) => new Set(prev).add(currentTask));
    if (currentTask < tasks.length - 1) {
      setTimeout(() => setCurrentTask((c) => c + 1), 800);
    } else {
      toast.success("Assessment complete! 🎉");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b border-border backdrop-blur-md ${isEgra ? "bg-egra-light/80" : "bg-egma-light/80"}`}>
        <div className="container flex items-center gap-3 py-3">
          <button onClick={() => navigate("/")} className="rounded-full p-2 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isEgra ? "bg-egra" : "bg-egma"} text-primary-foreground`}>
            {isEgra ? <BookOpen className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{isEgra ? "EGRA" : "EGMA"} Assessment</h1>
            <p className="text-xs text-muted-foreground">Task {currentTask + 1} of {tasks.length}</p>
          </div>
          {/* Progress */}
          <div className="ml-auto flex gap-1.5">
            {tasks.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  completedTasks.has(i)
                    ? isEgra ? "bg-egra" : "bg-egma"
                    : i === currentTask
                    ? isEgra ? "bg-egra/40" : "bg-egma/40"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8">
        {/* Task Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTask}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="mb-8"
          >
            <div className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-start gap-3 mb-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                  isEgra ? "bg-egra-light text-egra" : "bg-egma-light text-egma"
                }`}>
                  {currentTask + 1}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{task.prompt}</p>
                </div>
                {completedTasks.has(currentTask) && (
                  <CheckCircle2 className={`ml-auto h-6 w-6 shrink-0 ${isEgra ? "text-egra" : "text-egma"}`} />
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Input Mode Tabs */}
        <div className="mb-6 flex gap-2">
          {(Object.keys(modeConfig) as InputMode[]).map((mode) => {
            const { icon: Icon, label, color } = modeConfig[mode];
            const isActive = inputMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive ? `${color} shadow-soft` : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Input Area */}
        <motion.div
          key={inputMode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-card p-6 shadow-card"
        >
          {inputMode === "voice" && (
            <VoiceRecorder onRecordingComplete={(blob) => handleSubmission(blob)} />
          )}
          {inputMode === "text" && (
            <TextInputPanel onSubmit={(text) => handleSubmission(text)} />
          )}
          {inputMode === "image" && (
            <ImageUploader onImageSelected={(file) => handleSubmission(file)} />
          )}
        </motion.div>

        {/* Task Navigation */}
        <div className="mt-6 flex gap-2 justify-center">
          {tasks.map((t, i) => (
            <button
              key={i}
              onClick={() => setCurrentTask(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                i === currentTask
                  ? isEgra ? "bg-egra text-primary-foreground" : "bg-egma text-primary-foreground"
                  : completedTasks.has(i)
                  ? "bg-muted text-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AssessmentPage;
