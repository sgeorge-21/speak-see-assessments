import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Type, ImageIcon, ArrowLeft, CheckCircle2, BookOpen, Calculator } from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import TextInputPanel from "../components/TextInputPanel";
import ImageUploader from "../components/ImageUploader";
import TranscriptionBoard from "../components/TranscriptionBoard";
import ListenBar from "../components/ListenBar";
import AssessmentScoreSummary from "../components/AssessmentScoreSummary";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type InputMode = "voice" | "text" | "image";

interface TranscriptionResult {
  transcription: string;
  words_correct?: number;
  words_total?: number;
  accuracy_percentage?: number;
  errors?: Array<{ expected: string; actual: string; type: string }>;
}

interface TaskScore {
  taskTitle: string;
  wordsCorrect: number;
  wordsTotal: number;
  accuracy: number;
}

interface TaskContent {
  title: string;
  prompt: string;
  content?: string[];
  passage?: string;
}

const sampleTasks: Record<string, TaskContent[]> = {
  egra: [
    {
      title: "Letter Recognition",
      prompt: "Read aloud the letters shown below.",
      content: [
        "A", "m", "S", "t", "E", "r", "O", "b", "L", "d",
        "P", "n", "I", "c", "K", "f", "U", "g", "H", "w",
      ],
    },
    {
      title: "Familiar Words",
      prompt: "Read these words as quickly and clearly as you can.",
      content: [
        "the", "cat", "big", "run", "dog",
        "sun", "hat", "red", "sit", "mom",
        "cup", "bed", "fish", "play", "tree",
        "ball", "hand", "jump", "milk", "book",
      ],
    },
    {
      title: "Oral Reading Fluency",
      prompt: "Read the passage below aloud. Try to read clearly and at a comfortable pace.",
      passage:
        "The sun was warm on the green hill. A small dog ran across the grass. It saw a red ball near the tree. The dog picked up the ball and ran back to the boy. The boy smiled and threw the ball again. They played until the sun went down.",
    },
    {
      title: "Reading Comprehension",
      prompt: "Answer the questions about the passage you just read.",
      content: [
        "Where was the dog?",
        "What color was the ball?",
        "Who threw the ball?",
        "When did they stop playing?",
      ],
    },
  ],
  egma: [
    { title: "Number Identification", prompt: "Identify the numbers shown on the screen.", content: ["3", "7", "12", "25", "48", "63", "81", "100", "156", "209"] },
    { title: "Quantity Comparison", prompt: "Which number is bigger? Say or type your answer.", content: ["5 or 8?", "12 or 9?", "34 or 43?", "67 or 76?"] },
    { title: "Addition & Subtraction", prompt: "Solve the problems shown below.", content: ["3 + 2 = ?", "7 - 4 = ?", "8 + 5 = ?", "15 - 6 = ?", "12 + 9 = ?", "20 - 8 = ?"] },
    { title: "Word Problems", prompt: "Listen to or read the word problem and provide your answer.", content: ["Sam has 3 apples. He gets 4 more. How many does he have?", "There are 10 birds on a tree. 6 fly away. How many are left?"] },
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
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [taskScores, setTaskScores] = useState<TaskScore[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const assessmentType = type === "egma" ? "egma" : "egra";
  const tasks = sampleTasks[assessmentType];
  const task = tasks[currentTask];
  const isEgra = assessmentType === "egra";

  const getExpectedText = () => {
    if (task.passage) return task.passage;
    if (task.content) return task.content.join(" ");
    return "";
  };

  const handleSubmission = (data: string | Blob | File) => {
    toast.success(`Response recorded for "${task.title}"`);
    setCompletedTasks((prev) => new Set(prev).add(currentTask));
    // Don't auto-advance — wait for transcription verification
  };

  const handleTranscriptionResult = (result: TranscriptionResult) => {
    setTranscriptionResult(result);

    // Save score for this task
    const score: TaskScore = {
      taskTitle: task.title,
      wordsCorrect: result.words_correct ?? 0,
      wordsTotal: result.words_total ?? 0,
      accuracy: result.accuracy_percentage ?? 0,
    };
    setTaskScores((prev) => {
      const updated = prev.filter((s) => s.taskTitle !== task.title);
      return [...updated, score];
    });

    setCompletedTasks((prev) => new Set(prev).add(currentTask));
    toast.success("Transcription complete!");
  };

  const handleNextTask = () => {
    if (currentTask < tasks.length - 1) {
      setCurrentTask((c) => c + 1);
      setTranscriptionResult(null);
    } else {
      setShowSummary(true);
    }
  };

  const handleTaskChange = (i: number) => {
    setCurrentTask(i);
    setTranscriptionResult(null);
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-background">
        <header className={`sticky top-0 z-10 border-b border-border backdrop-blur-md ${isEgra ? "bg-egra-light/80" : "bg-egma-light/80"}`}>
          <div className="container flex items-center gap-3 py-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isEgra ? "bg-egra" : "bg-egma"} text-primary-foreground`}>
              {isEgra ? <BookOpen className="h-4 w-4" /> : <Calculator className="h-4 w-4" />}
            </div>
            <h1 className="text-sm font-bold text-foreground">{isEgra ? "EGRA" : "EGMA"} Results</h1>
          </div>
        </header>
        <main className="container max-w-2xl py-8">
          <AssessmentScoreSummary
            scores={taskScores}
            isEgra={isEgra}
            onGoBack={() => navigate("/")}
          />
        </main>
      </div>
    );
  }

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
        {/* Task Card — always visible */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTask}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="mb-4"
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

              {/* Reading Content */}
              {task.content && !task.passage && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {task.content.map((item, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-lg font-bold ${
                        isEgra ? "bg-egra-light text-egra" : "bg-egma-light text-egma"
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {/* Reading Passage */}
              {task.passage && (
                <div className={`mt-4 rounded-xl p-4 text-base leading-relaxed font-medium text-foreground ${
                  isEgra ? "bg-egra-light/50" : "bg-egma-light/50"
                }`}>
                  {task.passage}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Listen Bar */}
        {getExpectedText() && (
          <div className="mb-4">
            <ListenBar text={getExpectedText()} isEgra={isEgra} />
          </div>
        )}

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
            <VoiceRecorder
              onRecordingComplete={(blob) => handleSubmission(blob)}
              expectedText={getExpectedText()}
              onTranscriptionResult={handleTranscriptionResult}
            />
          )}
          {inputMode === "text" && (
            <TextInputPanel
              onSubmit={(text) => handleSubmission(text)}
              expectedText={getExpectedText()}
              onComparisonResult={handleTranscriptionResult}
            />
          )}
          {inputMode === "image" && (
            <ImageUploader
              onImageSelected={(file) => handleSubmission(file)}
              expectedText={getExpectedText()}
              onComparisonResult={handleTranscriptionResult}
            />
          )}
        </motion.div>

        {/* Transcription Results Board */}
        {transcriptionResult && (
          <>
            <TranscriptionBoard
              result={transcriptionResult}
              expectedText={getExpectedText()}
              isEgra={isEgra}
            />
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNextTask}
              className={`mt-6 w-full rounded-xl px-4 py-3 font-bold text-primary-foreground transition-transform hover:scale-[1.02] ${
                isEgra ? "bg-egra" : "bg-egma"
              }`}
            >
              {currentTask < tasks.length - 1 ? "Next Task →" : "View Results 🎉"}
            </motion.button>
          </>
        )}

        {/* Task Navigation */}
        <div className="mt-6 flex gap-2 justify-center">
          {tasks.map((t, i) => (
            <button
              key={i}
              onClick={() => handleTaskChange(i)}
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
