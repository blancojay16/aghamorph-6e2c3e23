import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { SYSTEMS, type BodySystem } from "@/lib/systems";
import { addScore, awardBadge } from "@/lib/progress";

export const Route = createFileRoute("/matching")({
  head: () => ({
    meta: [{ title: "Matching Game — Aghamorph" }],
  }),
  component: MatchingGame,
});

interface Item {
  text: string;
  system: BodySystem;
}

const POOL: Item[] = [
  { text: "Running a race", system: "muscular" },
  { text: "Eating mango", system: "digestive" },
  { text: "Breathing fresh air", system: "respiratory" },
  { text: "Heart pumping blood", system: "circulatory" },
  { text: "Standing tall", system: "skeletal" },
  { text: "Climbing stairs", system: "muscular" },
  { text: "Drinking water", system: "digestive" },
  { text: "Blowing balloons", system: "respiratory" },
  { text: "Feeling pulse on wrist", system: "circulatory" },
  { text: "Protecting your brain", system: "skeletal" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchingGame() {
  const [round, setRound] = useState(0);
  const items = useMemo(() => shuffle(POOL).slice(0, 5), [round]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<BodySystem | null>(null);
  const [score, setScore] = useState(0);

  const current = items[idx];
  const done = !current;

  const pick = (sys: BodySystem) => {
    if (picked) return;
    setPicked(sys);
    const correct = sys === current.system;
    if (correct) {
      addScore(3);
      setScore((s) => s + 1);
    }
    setTimeout(() => {
      if (idx + 1 >= items.length) {
        if (score + (correct ? 1 : 0) >= 4) awardBadge(current.system);
      }
      setIdx((i) => i + 1);
      setPicked(null);
    }, 900);
  };

  const reset = () => {
    setRound((r) => r + 1);
    setIdx(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-center mb-2">Match it! 🎯</h1>
        <p className="text-center text-muted-foreground mb-6">
          Which body system is doing this?
        </p>

        {done ? (
          <div className="rounded-3xl p-8 text-center bg-card border-2 border-primary">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Round complete!</h2>
            <p className="text-lg mb-5">
              You got <span className="font-bold text-primary">{score}/{items.length}</span> right.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-8 mb-6 bg-card border-2 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Question {idx + 1} of {items.length}
              </p>
              <p className="text-2xl md:text-3xl font-bold">{current.text}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SYSTEMS.map((s) => {
                const isPicked = picked === s.key;
                const isCorrect = picked && s.key === current.system;
                const styleState =
                  picked && isCorrect
                    ? "ring-4 ring-[oklch(0.7_0.18_145)]"
                    : isPicked
                      ? "ring-4 ring-destructive opacity-70"
                      : "";
                return (
                  <button
                    key={s.key}
                    disabled={!!picked}
                    onClick={() => pick(s.key)}
                    className={`rounded-2xl p-4 border-2 bg-card hover:scale-105 transition text-center disabled:cursor-not-allowed ${styleState}`}
                    style={{ borderColor: s.colorVar }}
                  >
                    <div className="text-4xl mb-1">{s.emoji}</div>
                    <div className="font-bold">{s.label}</div>
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
