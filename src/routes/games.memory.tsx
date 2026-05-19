import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";

export const Route = createFileRoute("/games/memory")({
  head: () => ({ meta: [{ title: "Memory Flip — Aghamorph" }] }),
  component: Memory,
});

const PAIRS: { a: string; b: string; color: string }[] = [
  { a: "🫀 Heart", b: "Pumps blood", color: "var(--circulatory)" },
  { a: "🫁 Lungs", b: "Breathe air", color: "var(--respiratory)" },
  { a: "🧠 Brain", b: "Thinks & controls", color: "var(--respiratory)" },
  { a: "🦴 Bones", b: "Hold body up", color: "var(--skeletal)" },
  { a: "💪 Muscles", b: "Move the body", color: "var(--muscular)" },
  { a: "🍎 Stomach", b: "Digests food", color: "var(--digestive)" },
];

interface Card {
  id: number;
  pairKey: number;
  text: string;
  color: string;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  PAIRS.forEach((p, i) => {
    deck.push({ id: i * 2, pairKey: i, text: p.a, color: p.color });
    deck.push({ id: i * 2 + 1, pairKey: i, text: p.b, color: p.color });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function Memory() {
  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);

  const done = matched.size === PAIRS.length;

  const click = (id: number) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.has(deck.find((c) => c.id === id)!.pairKey)) return;
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
    setDeck(buildDeck());
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
          Find each organ and what it does!
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {deck.map((card) => {
            const isFlipped = flipped.includes(card.id) || matched.has(card.pairKey);
            const isMatched = matched.has(card.pairKey);
            return (
              <button
                key={card.id}
                onClick={() => click(card.id)}
                className={`aspect-[3/4] rounded-2xl border-2 font-bold text-sm sm:text-base transition ${
                  isFlipped
                    ? `bg-card ${isMatched ? "opacity-60" : ""}`
                    : "bg-primary text-primary-foreground hover:scale-105"
                }`}
                style={{ borderColor: isFlipped ? card.color : "transparent" }}
              >
                {isFlipped ? (
                  <span className="px-1 leading-tight block">{card.text}</span>
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
      </main>
    </div>
  );
}
