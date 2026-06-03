import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEMS, systemMeta, type BodySystem } from "@/lib/systems";

export const Route = createFileRoute("/games/jigsaw")({
  head: () => ({ meta: [{ title: "Jigsaw Puzzle — Aghamorph" }] }),
  component: Jigsaw,
});

const SIZE = 3; // 3x3

function shuffled(): number[] {
  const arr = Array.from({ length: SIZE * SIZE }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (arr.every((v, i) => v === i)) return shuffled();
  return arr;
}

type Puzzle = {
  id: string;
  label: string;
  system: BodySystem;
  url: string;
};

function Jigsaw() {
  const { data: puzzles = [], isLoading } = useQuery({
    queryKey: ["game-assets-jigsaw"],
    queryFn: async (): Promise<Puzzle[]> => {
      const { data, error } = await supabase
        .from("game_assets")
        .select("id,label,system,file_path")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((a) => ({
        id: a.id,
        label: a.label,
        system: a.system as BodySystem,
        url: supabase.storage.from("videos").getPublicUrl(a.file_path).data.publicUrl,
      }));
    },
  });

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const puzzle = puzzles[puzzleIdx];
  const meta = puzzle ? systemMeta(puzzle.system) : null;
  const color = meta?.colorVar ?? "var(--primary)";

  const [tiles, setTiles] = useState<number[]>(() => shuffled());
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    setTiles(shuffled());
    setSelected(null);
    setSolved(false);
  }, [puzzleIdx, puzzles.length]);

  useEffect(() => {
    if (!puzzle) return;
    if (!solved && tiles.every((v, i) => v === i)) {
      setSolved(true);
      addScore(8);
    }
  }, [tiles, solved, puzzle]);

  const tap = (i: number) => {
    if (solved) return;
    if (selected === null) return setSelected(i);
    if (selected === i) return setSelected(null);
    const next = [...tiles];
    [next[selected], next[i]] = [next[i], next[selected]];
    setTiles(next);
    setSelected(null);
  };

  const tileBg = useMemo(
    () => ({
      backgroundImage: puzzle ? `url("${puzzle.url}")` : undefined,
      backgroundSize: `${SIZE * 100}% ${SIZE * 100}%`,
    }),
    [puzzle],
  );

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <BackBar title="Jigsaw Puzzle 🧩" />

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading puzzles…</p>
        ) : puzzles.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">
              No puzzle images yet. Ask your teacher to upload some in the Teacher
              dashboard → Game images.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {puzzles.map((p, i) => {
                const m = systemMeta(p.system);
                return (
                  <button
                    key={p.id}
                    onClick={() => setPuzzleIdx(i)}
                    className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${
                      i === puzzleIdx
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card"
                    }`}
                    style={i === puzzleIdx ? {} : { borderColor: m.colorVar }}
                  >
                    {m.emoji} {p.label}
                  </button>
                );
              })}
            </div>

            <p className="text-center text-sm text-muted-foreground mb-3">
              Tap two pieces to swap them and rebuild the {puzzle?.label.toLowerCase()}.
            </p>

            {/* Guide image */}
            {puzzle && (
              <div className="mx-auto mb-4 max-w-[360px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Guide
                  </span>
                  <button
                    onClick={() => setShowGuide((s) => !s)}
                    className="text-xs px-2 py-1 rounded-full bg-muted font-semibold"
                  >
                    {showGuide ? "Hide" : "Show"}
                  </button>
                </div>
                {showGuide && (
                  <div
                    className="rounded-2xl overflow-hidden border-2 bg-card"
                    style={{ borderColor: color }}
                  >
                    <img
                      src={puzzle.url}
                      alt={`Guide: ${puzzle.label}`}
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            <div
              className="relative mx-auto rounded-3xl p-3 bg-card border-2"
              style={{ borderColor: color, maxWidth: 360 }}
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
                      className={`relative rounded-lg overflow-hidden transition bg-muted ${
                        isSelected ? "ring-4 ring-primary scale-95" : "hover:scale-105"
                      }`}
                      style={{
                        ...tileBg,
                        backgroundPosition: `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`,
                      }}
                      aria-label={`Tile ${pos + 1}`}
                    />
                  );
                })}
              </div>

              {solved && (
                <div className="absolute inset-0 grid place-items-center bg-background/90 rounded-3xl">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎉</div>
                    <p className="text-xl font-bold mb-3">You did it!</p>
                    <div className="flex gap-2 justify-center">
                      {puzzles.length > 1 && (
                        <button
                          onClick={() => setPuzzleIdx((puzzleIdx + 1) % puzzles.length)}
                          className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold"
                        >
                          Next puzzle →
                        </button>
                      )}
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
          </>
        )}
      </main>
    </div>
  );
}

function BackBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted hover:bg-secondary">
        ←
      </Link>
      <h1 className="text-2xl font-extrabold">{title}</h1>
    </div>
  );
}
