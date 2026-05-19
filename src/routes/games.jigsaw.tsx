import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";

export const Route = createFileRoute("/games/jigsaw")({
  head: () => ({ meta: [{ title: "Jigsaw Puzzle — Aghamorph" }] }),
  component: Jigsaw,
});

const PUZZLES = [
  { emoji: "🫀", label: "Heart", color: "var(--circulatory)" },
  { emoji: "🫁", label: "Lungs", color: "var(--respiratory)" },
  { emoji: "🦴", label: "Bone", color: "var(--skeletal)" },
  { emoji: "🧠", label: "Brain", color: "var(--respiratory)" },
];

const SIZE = 3; // 3x3

function shuffled(): number[] {
  const arr = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // ensure not already solved
  if (arr.every((v, i) => v === i)) return shuffled();
  return arr;
}

function Jigsaw() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = PUZZLES[puzzleIdx];
  const [tiles, setTiles] = useState<number[]>(() => shuffled());
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    setTiles(shuffled());
    setSelected(null);
    setSolved(false);
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 1800);
    return () => clearTimeout(t);
  }, [puzzleIdx]);

  useEffect(() => {
    if (!solved && tiles.every((v, i) => v === i)) {
      setSolved(true);
      addScore(8);
    }
  }, [tiles, solved]);

  const tap = (i: number) => {
    if (solved) return;
    if (selected === null) {
      setSelected(i);
      return;
    }
    if (selected === i) {
      setSelected(null);
      return;
    }
    const next = [...tiles];
    [next[selected], next[i]] = [next[i], next[selected]];
    setTiles(next);
    setSelected(null);
  };

  // Each tile renders the full emoji shifted so 1/9th shows.
  const tileStyle = (): React.CSSProperties => ({
    backgroundImage: `radial-gradient(circle at center, color-mix(in oklab, ${puzzle.color} 22%, transparent), transparent 70%)`,
    overflow: "hidden",
    position: "relative",
  });

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <BackBar title="Jigsaw Puzzle 🧩" />

        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {PUZZLES.map((p, i) => (
            <button
              key={p.label}
              onClick={() => setPuzzleIdx(i)}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${i === puzzleIdx ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}
              style={i === puzzleIdx ? {} : { borderColor: p.color }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mb-3">
          Tap two pieces to swap them and rebuild the {puzzle.label.toLowerCase()}.
        </p>

        <div
          className="relative mx-auto rounded-3xl p-3 bg-card border-2"
          style={{ borderColor: puzzle.color, maxWidth: 360 }}
        >
          <div className="grid grid-cols-3 gap-1.5 aspect-square">
            {tiles.map((orig, pos) => {
              const row = Math.floor(orig / SIZE);
              const col = orig % SIZE;
              const isSelected = selected === pos;
              return (
                <button
                  key={pos}
                  onClick={() => tap(pos)}
                  className={`relative rounded-lg overflow-hidden transition ${isSelected ? "ring-4 ring-primary scale-95" : "hover:scale-105"}`}
                  style={tileStyle()}
                  aria-label={`Tile ${pos + 1}`}
                >
                  <div
                    className="absolute"
                    style={{
                      fontSize: "calc(min(360px, 100vw - 4rem) * 0.95)",
                      lineHeight: 1,
                      top: `${-row * (100 / SIZE)}%`,
                      left: `${-col * (100 / SIZE)}%`,
                      width: `${SIZE * 100}%`,
                      height: `${SIZE * 100}%`,
                      display: "grid",
                      placeItems: "center",
                      filter: showHint ? "none" : "none",
                    }}
                  >
                    {puzzle.emoji}
                  </div>
                </button>
              );
            })}
          </div>

          {solved && (
            <div className="absolute inset-0 grid place-items-center bg-background/90 rounded-3xl">
              <div className="text-center">
                <div className="text-6xl mb-2">🎉</div>
                <p className="text-xl font-bold mb-3">You did it!</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setPuzzleIdx((puzzleIdx + 1) % PUZZLES.length)}
                    className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold"
                  >
                    Next puzzle →
                  </button>
                  <button
                    onClick={() => setTiles(shuffled())}
                    className="px-5 py-2 rounded-full bg-muted font-bold"
                  >
                    Play again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setTiles(shuffled())}
          className="mx-auto mt-4 block px-5 py-2 rounded-full bg-muted font-bold"
        >
          🔀 Shuffle
        </button>
      </main>
    </div>
  );
}

function BackBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted hover:bg-secondary">←</Link>
      <h1 className="text-2xl font-extrabold">{title}</h1>
    </div>
  );
}
