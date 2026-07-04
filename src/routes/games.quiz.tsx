import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";

export const Route = createFileRoute("/games/quiz")({
  head: () => ({ meta: [{ title: "Quiz Rush — Aghamorph" }] }),
  component: Quiz,
});

interface Q {
  q: string;
  choices: string[];
  answer: number;
}

const POOL: Q[] = [
  { q: "Which organ pumps blood?", choices: ["Lungs", "Heart", "Brain", "Stomach"], answer: 1 },
  { q: "What system helps you breathe?", choices: ["Digestive", "Skeletal", "Respiratory", "Muscular"], answer: 2 },
  { q: "Bones belong to the…", choices: ["Skeletal system", "Nervous system", "Digestive system", "Circulatory system"], answer: 0 },
  { q: "Which body part digests food?", choices: ["Heart", "Stomach", "Lungs", "Bones"], answer: 1 },
  { q: "Muscles help you…", choices: ["Think", "See", "Move", "Breathe"], answer: 2 },
  { q: "Blood travels through…", choices: ["Bones", "Nerves", "Vessels", "Lungs"], answer: 2 },
  { q: "How many lungs do you have?", choices: ["1", "2", "3", "4"], answer: 1 },
  { q: "The brain is part of the…", choices: ["Nervous system", "Skeletal system", "Digestive system", "Muscular system"], answer: 0 },
  { q: "Which protects your brain?", choices: ["Ribs", "Skull", "Spine", "Hips"], answer: 1 },
  { q: "We get oxygen from…", choices: ["Food", "Water", "Air", "Sleep"], answer: 2 },
  { q: "Which is NOT a body system?", choices: ["Digestive", "Musical", "Skeletal", "Respiratory"], answer: 1 },
  { q: "Heart beats faster when you…", choices: ["Sleep", "Run", "Sit", "Read"], answer: 1 },
];

const TIME_PER_Q = 10; // seconds
const TOTAL = 8;

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function Quiz() {
  const [round, setRound] = useState(0);
  const questions = useMemo(() => shuffle(POOL).slice(0, TOTAL), [round]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [time, setTime] = useState(TIME_PER_Q);
  const timer = useRef<number | null>(null);

  const current = questions[idx];
  const done = !current;

  useEffect(() => {
    if (done || picked !== null) return;
    setTime(TIME_PER_Q);
    timer.current = window.setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          window.clearInterval(timer.current!);
          handlePick(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [idx, done]);

  const handlePick = (i: number) => {
    if (picked !== null || done) return;
    if (timer.current) window.clearInterval(timer.current);
    setPicked(i);
    const correct = i === current.answer;
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => Math.max(b, n));
        return n;
      });
      addScore(1);
      void awardGameScore("quiz", 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setIdx((n) => n + 1);
      setPicked(null);
    }, 950);
  };

  const reset = () => {
    setRound((r) => r + 1);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBest(0);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Quiz Rush ⚡</h1>
        </div>

        {done ? (
          <div className="rounded-3xl p-8 text-center bg-card border-2 border-primary">
            <div className="text-6xl mb-2">🏁</div>
            <h2 className="text-2xl font-bold mb-2">Time's up!</h2>
            <p className="text-lg mb-1">Score: <span className="font-bold text-primary">{score}</span></p>
            <p className="text-sm text-muted-foreground mb-5">Best streak: {best} 🔥</p>
            <button onClick={reset} className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold">
              Play again
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3 text-sm font-bold">
              <span className="bg-muted px-3 py-1.5 rounded-full">Q {idx + 1}/{TOTAL}</span>
              <span className="bg-accent text-accent-foreground px-3 py-1.5 rounded-full">⭐ {score}</span>
              {streak > 1 && (
                <span className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full">🔥 {streak}</span>
              )}
              <span className="ml-auto bg-muted px-3 py-1.5 rounded-full tabular-nums">⏱ {time}s</span>
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden mb-5">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(time / TIME_PER_Q) * 100}%` }}
              />
            </div>

            <div className="rounded-3xl p-6 mb-5 bg-card border-2 text-center">
              <p className="text-xl md:text-2xl font-bold">{current.q}</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {current.choices.map((c, i) => {
                const isPicked = picked === i;
                const isAnswer = picked !== null && i === current.answer;
                const cls =
                  picked === null
                    ? "bg-card hover:scale-[1.02] border-border"
                    : isAnswer
                      ? "bg-[oklch(0.7_0.18_145)] text-white border-transparent"
                      : isPicked
                        ? "bg-destructive text-destructive-foreground border-transparent"
                        : "bg-card opacity-60 border-border";
                return (
                  <button
                    key={i}
                    disabled={picked !== null}
                    onClick={() => handlePick(i)}
                    className={`rounded-2xl p-4 border-2 font-bold text-left transition ${cls}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
