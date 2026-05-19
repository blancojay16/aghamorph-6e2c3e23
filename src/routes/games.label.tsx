import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";

export const Route = createFileRoute("/games/label")({
  head: () => ({ meta: [{ title: "Label the Body — Aghamorph" }] }),
  component: LabelBody,
});

// Positions are % within a 200x320 SVG viewBox area shown as overlay.
interface Spot {
  key: string;
  label: string;
  emoji: string;
  // percentage coords for the dot
  x: number;
  y: number;
}

const SPOTS: Spot[] = [
  { key: "brain", label: "Brain", emoji: "🧠", x: 50, y: 8 },
  { key: "lungs", label: "Lungs", emoji: "🫁", x: 35, y: 32 },
  { key: "heart", label: "Heart", emoji: "🫀", x: 55, y: 36 },
  { key: "stomach", label: "Stomach", emoji: "🍎", x: 50, y: 55 },
  { key: "bones", label: "Bones", emoji: "🦴", x: 25, y: 72 },
  { key: "muscles", label: "Muscles", emoji: "💪", x: 75, y: 72 },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function LabelBody() {
  const [round, setRound] = useState(0);
  const labels = useMemo(() => shuffle(SPOTS), [round]);
  const [placed, setPlaced] = useState<Record<string, string>>({}); // spotKey -> labelKey
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);

  const allDone = Object.keys(placed).length === SPOTS.length;

  const placeOn = (spotKey: string) => {
    if (!picked || placed[spotKey]) return;
    if (picked === spotKey) {
      setPlaced((p) => ({ ...p, [spotKey]: picked }));
      addScore(2);
      setPicked(null);
      if (Object.keys(placed).length + 1 === SPOTS.length) addScore(10);
    } else {
      setWrong(spotKey);
      setTimeout(() => setWrong(null), 500);
      setPicked(null);
    }
  };

  const remaining = labels.filter((l) => !Object.values(placed).includes(l.key));

  const reset = () => {
    setRound((r) => r + 1);
    setPlaced({});
    setPicked(null);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Label the Body 🏷️</h1>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Tap a label, then tap the matching spot on the body.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Body */}
          <div className="relative mx-auto w-full max-w-[280px] aspect-[5/8] rounded-3xl bg-card border-2 border-border">
            <svg viewBox="0 0 200 320" className="absolute inset-0 w-full h-full p-4">
              {/* simple silhouette */}
              <g fill="color-mix(in oklab, var(--primary) 14%, transparent)" stroke="var(--primary)" strokeWidth="2">
                <circle cx="100" cy="35" r="26" />
                <path d="M60 70 Q100 60 140 70 L150 180 Q100 195 50 180 Z" />
                <rect x="55" y="180" width="35" height="110" rx="14" />
                <rect x="110" y="180" width="35" height="110" rx="14" />
                <rect x="35" y="75" width="22" height="90" rx="11" />
                <rect x="143" y="75" width="22" height="90" rx="11" />
              </g>
            </svg>

            {SPOTS.map((s) => {
              const filled = placed[s.key];
              const isWrong = wrong === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => placeOn(s.key)}
                  disabled={!!filled}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center font-bold text-xs transition ${
                    filled
                      ? "bg-[oklch(0.7_0.18_145)] text-white size-10"
                      : isWrong
                        ? "bg-destructive text-destructive-foreground size-9 animate-pulse"
                        : picked
                          ? "bg-primary text-primary-foreground size-9 ring-4 ring-primary/30"
                          : "bg-muted size-7"
                  }`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  aria-label={filled ? s.label : "Empty spot"}
                >
                  {filled ? s.emoji : "?"}
                </button>
              );
            })}
          </div>

          {/* Labels */}
          <div>
            <h2 className="font-bold mb-2 text-center md:text-left">Labels</h2>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {remaining.length === 0 ? (
                <p className="text-muted-foreground text-sm">All placed!</p>
              ) : (
                remaining.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setPicked(picked === l.key ? null : l.key)}
                    className={`px-4 py-2 rounded-full border-2 font-bold transition ${
                      picked === l.key
                        ? "bg-primary text-primary-foreground border-primary scale-105"
                        : "bg-card border-border hover:scale-105"
                    }`}
                  >
                    {l.emoji} {l.label}
                  </button>
                ))
              )}
            </div>

            {allDone && (
              <div className="mt-6 rounded-2xl p-5 text-center bg-card border-2 border-primary">
                <div className="text-4xl mb-1">🎉</div>
                <p className="font-bold mb-3">Perfect labeling!</p>
                <button onClick={reset} className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold">
                  Play again
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
