import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/games/memory")({
  head: () => ({ meta: [{ title: "Memory Flip — Aghamorph" }] }),
  component: Memory,
});

interface Card {
  id: number;
  pairKey: number;
  url: string;
}

const MAX_PAIRS = 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(assets: { id: string; url: string }[]): Card[] {
  const pairs = shuffle(assets).slice(0, MAX_PAIRS);
  const deck: Card[] = [];
  pairs.forEach((p, i) => {
    deck.push({ id: i * 2, pairKey: i, url: p.url });
    deck.push({ id: i * 2 + 1, pairKey: i, url: p.url });
  });
  return shuffle(deck);
}

function Memory() {
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["game-assets", "memory"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("game_assets")
        .select("id,file_path") as any)
        .eq("game", "memory")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((a) => ({
        id: a.id,
        url: supabase.storage.from("videos").getPublicUrl(a.file_path).data.publicUrl,
      }));
    },
  });


  const [round, setRound] = useState(0);
  const deck = useMemo(() => buildDeck(assets), [assets, round]);
  const totalPairs = deck.length / 2;
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);

  const done = totalPairs > 0 && matched.size === totalPairs;

  const click = (id: number) => {
    const card = deck.find((c) => c.id === id)!;
    if (flipped.length === 2 || flipped.includes(id) || matched.has(card.pairKey)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next.map((i) => deck.find((c) => c.id === i)!);
      if (a.pairKey === b.pairKey) {
        setTimeout(() => {
          setMatched((s) => new Set(s).add(a.pairKey));
          setFlipped([]);
          addScore(2);
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  useEffect(() => {
    if (done) addScore(10);
  }, [done]);

  const reset = () => {
    setRound((r) => r + 1);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Memory Flip 🧠</h1>
          <span className="text-sm font-bold bg-muted px-3 py-1.5 rounded-full">Moves: {moves}</span>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Match each picture to its name!
        </p>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : deck.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">
              No game images yet. Ask your teacher to upload some in Teacher → 🧩 Game images.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {deck.map((card) => {
                const isFlipped = flipped.includes(card.id) || matched.has(card.pairKey);
                const isMatched = matched.has(card.pairKey);
                return (
                  <button
                    key={card.id}
                    onClick={() => click(card.id)}
                    className={`aspect-[3/4] rounded-2xl border-2 font-bold text-sm sm:text-base transition overflow-hidden ${
                      isFlipped
                        ? `bg-card border-primary ${isMatched ? "opacity-60" : ""}`
                        : "bg-primary text-primary-foreground hover:scale-105 border-transparent"
                    }`}
                  >
                    {isFlipped ? (
                      <img src={card.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">?</span>
                    )}
                  </button>

                );
              })}
            </div>

            {done && (
              <div className="mt-6 rounded-3xl p-6 text-center bg-card border-2 border-primary">
                <div className="text-5xl mb-2">🏆</div>
                <p className="text-xl font-bold mb-1">All matched!</p>
                <p className="text-muted-foreground mb-4">in {moves} moves</p>
                <button onClick={reset} className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold">
                  Play again
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
