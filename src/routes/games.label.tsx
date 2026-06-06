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
  { key: "brain", label: "Brain", emoji: "🧠", x: 50, y: 6 },
  { key: "eyes", label: "Eyes", emoji: "👀", x: 50, y: 11 },
  { key: "nose", label: "Nose", emoji: "👃", x: 50, y: 14 },
  { key: "mouth", label: "Mouth", emoji: "👄", x: 50, y: 17 },
  { key: "throat", label: "Throat", emoji: "🗣️", x: 50, y: 22 },
  { key: "lungs", label: "Lungs", emoji: "🫁", x: 36, y: 32 },
  { key: "heart", label: "Heart", emoji: "🫀", x: 56, y: 33 },
  { key: "liver", label: "Liver", emoji: "🥩", x: 38, y: 44 },
  { key: "stomach", label: "Stomach", emoji: "🍎", x: 58, y: 45 },
  { key: "kidney", label: "Kidneys", emoji: "🫘", x: 50, y: 52 },
  { key: "intestines", label: "Intestines", emoji: "🌀", x: 50, y: 60 },
  { key: "arm", label: "Arm bone", emoji: "🦴", x: 18, y: 50 },
  { key: "hand", label: "Hand", emoji: "✋", x: 12, y: 70 },
  { key: "muscle", label: "Thigh muscle", emoji: "💪", x: 38, y: 78 },
  { key: "knee", label: "Knee", emoji: "🦵", x: 62, y: 82 },
  { key: "foot", label: "Foot", emoji: "🦶", x: 62, y: 95 },
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
          <h1 className="text-2xl font-extrabold flex-1">Label the Body 🏷️</h1>
          <span className="text-xs text-muted-foreground">
            {Object.keys(placed).length}/{SPOTS.length}
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Tap a label, then tap the matching spot on the body.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Body */}
          <div className="relative mx-auto w-full max-w-[320px] aspect-[5/8] rounded-3xl bg-gradient-to-b from-card to-secondary/40 border-2 border-border overflow-hidden">
            <svg viewBox="0 0 200 320" className="absolute inset-0 w-full h-full p-3">
              <defs>
                <radialGradient id="skin" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="color-mix(in oklab, var(--primary) 22%, transparent)" />
                  <stop offset="100%" stopColor="color-mix(in oklab, var(--primary) 8%, transparent)" />
                </radialGradient>
              </defs>
              <g fill="url(#skin)" stroke="var(--primary)" strokeWidth="1.8" strokeLinejoin="round">
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
              {/* subtle organ hints */}
              <g opacity="0.35" fill="var(--primary)">
                <ellipse cx="80" cy="105" rx="10" ry="14" />
                <ellipse cx="118" cy="108" rx="9" ry="12" />
                <circle cx="100" cy="145" r="10" />
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
                      ? "bg-[oklch(0.7_0.18_145)] text-white size-7 shadow-md"
                      : isWrong
                        ? "bg-destructive text-destructive-foreground size-6 animate-pulse"
                        : picked
                          ? "bg-primary text-primary-foreground size-6 ring-4 ring-primary/30 animate-pulse"
                          : "bg-muted size-5 hover:bg-primary/40"
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
            <h2 className="font-bold mb-2 text-center md:text-left">Labels</h2>
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
