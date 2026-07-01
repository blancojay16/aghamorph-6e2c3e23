import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";

export const Route = createFileRoute("/games/label")({
  head: () => ({ meta: [{ title: "Label the Sky — Aghamorph" }] }),
  component: LabelSky,
});

interface Spot {
  key: string;
  label: string;
  emoji: string;
  x: number; // % within container
  y: number;
}

// Each spot is a WEATHER TOPIC placed where it best appears in a weather scene.
const SPOTS: Spot[] = [
  { key: "air_temperature", label: "Air Temperature", emoji: "🌡️", x: 88, y: 14 },
  { key: "air_pressure", label: "Air Pressure", emoji: "🧭", x: 12, y: 20 },
  { key: "cloud_cover", label: "Cloud Cover", emoji: "☁️", x: 50, y: 15 },
  { key: "wind_direction", label: "Wind Direction", emoji: "🧭", x: 22, y: 45 },
  { key: "wind_speed", label: "Wind Speed", emoji: "💨", x: 78, y: 42 },
  { key: "humidity", label: "Humidity", emoji: "💧", x: 30, y: 68 },
  { key: "rainfall", label: "Rainfall", emoji: "🌧️", x: 60, y: 72 },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function LabelSky() {
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
          <h1 className="text-2xl font-extrabold flex-1">Label the Sky 🏷️</h1>
          <span className="text-xs text-muted-foreground">
            {Object.keys(placed).length}/{SPOTS.length}
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Tap a weather topic, then tap the spot in the sky where it belongs.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Weather scene */}
          <div className="relative mx-auto w-full max-w-[360px] aspect-[4/5] rounded-3xl border-2 border-border overflow-hidden bg-gradient-to-b from-[oklch(0.85_0.08_230)] via-[oklch(0.9_0.05_220)] to-[oklch(0.7_0.1_150)]">
            <svg viewBox="0 0 200 260" className="absolute inset-0 w-full h-full">
              {/* Sun */}
              <circle cx="176" cy="34" r="16" fill="oklch(0.85 0.18 80)" opacity="0.9" />
              <g stroke="oklch(0.85 0.18 80)" strokeWidth="2" opacity="0.7">
                <line x1="176" y1="10" x2="176" y2="4" />
                <line x1="176" y1="58" x2="176" y2="64" />
                <line x1="152" y1="34" x2="146" y2="34" />
                <line x1="200" y1="34" x2="206" y2="34" />
              </g>
              {/* Clouds */}
              <g fill="white" opacity="0.9">
                <ellipse cx="90" cy="38" rx="26" ry="10" />
                <ellipse cx="108" cy="32" rx="20" ry="9" />
                <ellipse cx="76" cy="34" rx="16" ry="8" />
                <ellipse cx="40" cy="70" rx="18" ry="7" opacity="0.7" />
              </g>
              {/* Wind swirls (left) */}
              <g fill="none" stroke="oklch(0.5 0.08 220)" strokeWidth="1.5" opacity="0.6">
                <path d="M20 110 q30 -8 55 0 q-10 6 -20 4" />
                <path d="M15 128 q40 -8 70 0 q-14 6 -24 4" />
              </g>
              {/* Wind gust (right) */}
              <g fill="none" stroke="oklch(0.5 0.08 220)" strokeWidth="1.8" opacity="0.7">
                <path d="M180 100 q-30 -6 -50 4" />
                <path d="M185 118 q-40 -6 -60 6" />
              </g>
              {/* Rain drops */}
              <g fill="oklch(0.55 0.18 250)" opacity="0.8">
                {[0,1,2,3,4,5,6,7].map((i) => (
                  <ellipse key={i} cx={90 + i * 8} cy={200 + (i % 2) * 8} rx="1.6" ry="4" />
                ))}
              </g>
              {/* Ground */}
              <path d="M0 240 Q100 224 200 240 L200 260 L0 260 Z" fill="oklch(0.6 0.14 145)" opacity="0.7" />
              {/* Thermometer hint */}
              <g opacity="0.5">
                <rect x="172" y="60" width="6" height="24" rx="3" fill="oklch(0.6 0.2 25)" />
                <circle cx="175" cy="88" r="5" fill="oklch(0.6 0.2 25)" />
              </g>
              {/* Barometer hint */}
              <g opacity="0.4">
                <circle cx="24" cy="60" r="10" fill="none" stroke="oklch(0.4 0.06 260)" strokeWidth="1.5" />
                <line x1="24" y1="60" x2="30" y2="55" stroke="oklch(0.4 0.06 260)" strokeWidth="1.5" />
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
                          : "bg-white/80 size-6 hover:bg-primary/40"
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
            <h2 className="font-bold mb-2 text-center md:text-left">Weather Topics</h2>
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
                <p className="font-bold mb-3">Perfect! You labeled every weather topic!</p>
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
