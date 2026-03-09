import { motion } from "framer-motion";
import { BookOpen, Calculator, ArrowRight, Mic, Type, Image } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="container max-w-4xl pt-16 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Early Grade Assessment Platform
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            EGRA <span className="text-gradient-primary">&</span> EGMA
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Assess foundational reading and math skills using voice, text, or picture inputs. Simple, fast, and reliable.
          </p>
        </motion.div>

        {/* Input Mode Badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Mic, label: "Voice Input", bg: "bg-egra-light", text: "text-egra" },
            { icon: Type, label: "Text Input", bg: "bg-egma-light", text: "text-egma" },
            { icon: Image, label: "Picture Upload", bg: "bg-coral-light", text: "text-coral" },
          ].map(({ icon: Icon, label, bg, text }) => (
            <span key={label} className={`flex items-center gap-2 rounded-full ${bg} px-4 py-2 text-sm font-semibold ${text}`}>
              <Icon className="h-4 w-4" />
              {label}
            </span>
          ))}
        </motion.div>
      </header>

      {/* Assessment Cards */}
      <main className="container max-w-4xl pb-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* EGRA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/assessment/egra")}
            className="group cursor-pointer rounded-2xl bg-card p-8 shadow-card transition-shadow hover:shadow-elevated"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-egra-light">
              <BookOpen className="h-7 w-7 text-egra" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">EGRA</h2>
            <p className="mt-1 text-sm font-medium text-egra">Early Grade Reading Assessment</p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Assess letter recognition, phonemic awareness, oral reading fluency, and reading comprehension.
            </p>
            <ul className="mt-4 space-y-2">
              {["Letter Recognition", "Familiar Words", "Oral Reading Fluency", "Reading Comprehension"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-egra" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-egra group-hover:gap-3 transition-all">
              Start Assessment <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>

          {/* EGMA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ y: -4 }}
            onClick={() => navigate("/assessment/egma")}
            className="group cursor-pointer rounded-2xl bg-card p-8 shadow-card transition-shadow hover:shadow-elevated"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-egma-light">
              <Calculator className="h-7 w-7 text-egma" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">EGMA</h2>
            <p className="mt-1 text-sm font-medium text-egma">Early Grade Mathematics Assessment</p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Evaluate number identification, quantity comparison, basic operations, and word problem solving.
            </p>
            <ul className="mt-4 space-y-2">
              {["Number Identification", "Quantity Comparison", "Addition & Subtraction", "Word Problems"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-egma" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-egma group-hover:gap-3 transition-all">
              Start Assessment <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
