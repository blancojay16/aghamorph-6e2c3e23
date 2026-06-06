import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";

export const Route = createFileRoute("/games/label")({
  head: () => ({ meta: [{ title: "Label the Body Systems — Aghamorph" }] }),
  component: LabelBody,
});

interface Spot {
  key: string;
  label: string;
  emoji: string;
  x: number; // % within container
  y: number;
}

// Each spot is a BODY SYSTEM placed on the part of the body that best represents it.
const SPOTS: Spot[] = [
  { key: "nervous", label: "Nervous System", emoji: "🧠", x: 50, y: 7 },
  { key: "respiratory", label: "Respiratory System", emoji: "🫁", x: 38, y: 32 },
  { key: "circulatory", label: "Circulatory System", emoji: "🫀", x: 58, y: 33 },
  { key: "digestive", label: "Digestive System", emoji: "🍎", x: 50, y: 48 },
  { key: "excretory", label: "Excretory System", emoji: "🫘", x: 62, y: 54 },
  { key: "muscular", label: "Muscular System", emoji: "💪", x: 22, y: 60 },
  { key: "skeletal", label: "Skeletal System", emoji: "🦴", x: 78, y: 60 },
  { key: "reproductive", label: "Reproductive System", emoji: "🌱", x: 50, y: 68 },
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
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const allDone = Object.keys(placed).length === SPOTS.length;

  const placeOn = (spotKey: string) => {
    if (!picked || placed[spotKey]) return;
    if (picked === spotKey) {
      setPlaced((p) => ({ ...p, [spotKey]: picked }));
      addScore(1);
      setPicked(null);
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
          <h1 className="text-2xl font-extrabold flex-1">Label the Body Systems 🏷️</h1>
          <span className="text-xs text-muted-foreground">
            {Object.keys(placed).length}/{SPOTS.length}
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Tap a system, then tap the part of the body where it belongs.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Body */}
          <div className="relative mx-auto w-full max-w-[340px] aspect-[5/8] rounded-3xl bg-gradient-to-b from-card to-secondary/40 border-2 border-border overflow-hidden">
            <svg viewBox="0 0 200 320" className="absolute inset-0 w-full h-full p-3">
              <defs>
                <radialGradient id="skin2" cx="50%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 25%, transparent)" />
                  <stop offset="100%" stopColor="color-mix(in oklab, var(--primary) 8%, transparent)" />
                </radialGradient>
              </defs>
              <g fill="url(#skin2)" stroke="var(--primary)" strokeWidth="1.8" strokeLinejoin="round">
                {/* head + neck */}
                <circle cx="100" cy="32" r="24" />
                <rect x="92" y="54" width="16" height="12" rx="4" />
                {/* torso */}
                <path d="M62 70 Q100 62 138 70 L146 175 Q100 188 54 175 Z" />
                {/* arms */}
                <path d="M62 72 L34 88 L30 168 L46 172 L58 100 Z" />
                <path d="M138 72 L166 88 L170 168 L154 172 L142 100 Z" />
                {/* hands */}
                <circle cx="34" cy="178" r="9" />
                <circle cx="166" cy="178" r="9" />
                {/* legs */}
                <path d="M70 178 L62 300 L86 304 L96 188 Z" />
                <path d="M130 178 L138 300 L114 304 L104 188 Z" />
                {/* feet */}
                <ellipse cx="74" cy="308" rx="14" ry="6" />
                <ellipse cx="126" cy="308" rx="14" ry="6" />
              </g>
              {/* anatomy hints to help students locate systems */}
              <g opacity="0.4" fill="none" stroke="var(--primary)" strokeWidth="1.2">
                {/* lungs */}
                <ellipse cx="82" cy="105" rx="12" ry="18" />
                <ellipse cx="118" cy="105" rx="12" ry="18" />
                {/* heart */}
                <path d="M104 110 q6 -8 12 0 q0 10 -12 18 q-12 -8 -12 -18 q6 -8 12 0 z" />
                {/* stomach + intestines */}
                <path d="M88 150 q14 -8 24 4 q-4 14 -22 10 z" />
                <path d="M86 168 q14 12 28 0 q-6 14 -14 14 q-10 0 -14 -14 z" />
                {/* kidneys */}
                <path d="M118 168 q8 0 8 10 q-2 6 -8 4 z" />
                {/* spine */}
                <line x1="100" y1="68" x2="100" y2="175" strokeDasharray="3 3" />
                {/* ribs */}
                <path d="M70 90 q30 -10 60 0" />
                <path d="M68 105 q32 -10 64 0" />
                <path d="M68 120 q32 -10 64 0" />
              </g>
            </svg>

            {SPOTS.map((s) => {
              const filled = placed[s.key];
              const isWrong = wrong === s.key;
              const isHover = hovered === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => placeOn(s.key)}
                  onMouseEnter={() => setHovered(s.key)}
                  onMouseLeave={() => setHovered(null)}
                  disabled={!!filled}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full grid place-items-center font-bold text-[10px] transition ${
                    filled
                      ? "bg-[oklch(0.7_0.18_145)] text-white size-8 shadow-md"
                      : isWrong
                        ? "bg-destructive text-destructive-foreground size-7 animate-pulse"
                        : picked
                          ? "bg-primary text-primary-foreground size-7 ring-4 ring-primary/30 animate-pulse"
                          : "bg-muted size-6 hover:bg-primary/40"
                  }`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  aria-label={filled ? s.label : "Empty spot"}
                  title={filled ? s.label : ""}
                >
                  {filled ? s.emoji : isHover ? "•" : ""}
                </button>
              );
            })}
          </div>

          {/* Labels */}
          <div>
            <h2 className="font-bold mb-2 text-center md:text-left">Body Systems</h2>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {remaining.length === 0 ? (
                <p className="text-muted-foreground text-sm">All placed!</p>
              ) : (
                remaining.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setPicked(picked === l.key ? null : l.key)}
                    className={`px-3 py-1.5 rounded-full border-2 font-semibold text-sm transition ${
                      picked === l.key
                        ? "bg-primary text-primary-foreground border-primary scale-105 shadow-lg"
                        : "bg-card border-border hover:scale-105 hover:border-primary/60"
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
                <p className="font-bold mb-3">Perfect! You labeled every system!</p>
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
