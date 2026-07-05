import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { StudentHeader } from "@/components/student-header";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";


type Group = "herbivore" | "carnivore" | "omnivore";

interface Animal {
  name: string;
  emoji: string;
  group: Group;
}

// Grade 4, Philippines-friendly examples
const ANIMALS: Animal[] = [
  { name: "Kalabaw (Carabao)", emoji: "🐃", group: "herbivore" },
  { name: "Kambing (Goat)", emoji: "🐐", group: "herbivore" },
  { name: "Kuneho (Rabbit)", emoji: "🐇", group: "herbivore" },
  { name: "Kabayo (Horse)", emoji: "🐎", group: "herbivore" },
  { name: "Higad (Caterpillar)", emoji: "🐛", group: "herbivore" },
  { name: "Leon (Lion)", emoji: "🦁", group: "carnivore" },
  { name: "Buwaya (Crocodile)", emoji: "🐊", group: "carnivore" },
  { name: "Agila (Eagle)", emoji: "🦅", group: "carnivore" },
  { name: "Pusa (Cat)", emoji: "🐈", group: "carnivore" },
  { name: "Pating (Shark)", emoji: "🦈", group: "carnivore" },
  { name: "Tao (Human)", emoji: "🧑", group: "omnivore" },
  { name: "Baboy (Pig)", emoji: "🐖", group: "omnivore" },
  { name: "Manok (Chicken)", emoji: "🐔", group: "omnivore" },
  { name: "Oso (Bear)", emoji: "🐻", group: "omnivore" },
  { name: "Unggoy (Monkey)", emoji: "🐒", group: "omnivore" },
];

const GROUPS: { key: Group; label: string; emoji: string; color: string }[] = [
  { key: "herbivore", label: "Herbivore", emoji: "🌿", color: "var(--herbivore)" },
  { key: "carnivore", label: "Carnivore", emoji: "🍖", color: "var(--carnivore)" },
  { key: "omnivore", label: "Omnivore", emoji: "🌿🍖", color: "var(--omnivore)" },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const ROUND_SIZE = 9;

function SortTheEaters() {
  const [round, setRound] = useState(0);
  const deck = useMemo(() => shuffle(ANIMALS).slice(0, ROUND_SIZE), [round]);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<Group | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [placed, setPlaced] = useState<{ animal: Animal; picked: Group; ok: boolean }[]>([]);

  const current = deck[index];
  const done = index >= deck.length;

  const pick = (g: Group) => {
    if (!current || wrong) return;
    const ok = g === current.group;
    if (ok) {
      addScore(1);
      void awardGameScore("label", 1);
      setCorrectCount((c) => c + 1);
      setPlaced((p) => [...p, { animal: current, picked: g, ok: true }]);
      setIndex((i) => i + 1);
    } else {
      setWrong(g);
      setTimeout(() => {
        setPlaced((p) => [...p, { animal: current, picked: g, ok: false }]);
        setWrong(null);
        setIndex((i) => i + 1);
      }, 550);
    }
  };

  const reset = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setWrong(null);
    setCorrectCount(0);
    setPlaced([]);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Sort the Eaters 🏷️</h1>
          <span className="text-xs text-muted-foreground">
            {Math.min(index, deck.length)}/{deck.length}
          </span>
        </div>

        <p className="text-center text-sm text-muted-foreground mb-4">
          Look at the animal, then tap <b>Herbivore</b>, <b>Carnivore</b>, or <b>Omnivore</b>.
        </p>

        {!done ? (
          <>
            <div className="mx-auto w-full max-w-sm aspect-square rounded-3xl border-2 border-border bg-card grid place-items-center mb-6 shadow-sm">
              <div className="text-center px-4">
                <div className="text-[8rem] leading-none mb-2">{current.emoji}</div>
                <p className="text-xl font-bold">{current.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {GROUPS.map((g) => {
                const isWrong = wrong === g.key;
                return (
                  <button
                    key={g.key}
                    onClick={() => pick(g.key)}
                    disabled={!!wrong}
                    className={`rounded-2xl border-2 p-4 font-bold text-center transition ${
                      isWrong
                        ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                        : "bg-card hover:scale-105 hover:shadow-md"
                    }`}
                    style={!isWrong ? { borderColor: g.color } : undefined}
                  >
                    <div className="text-3xl mb-1">{g.emoji}</div>
                    <div className="text-sm">{g.label}</div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-3xl p-6 text-center bg-card border-2 border-primary">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold mb-1">Round done!</h2>
            <p className="mb-4">
              You got <span className="font-bold text-primary">{correctCount}/{deck.length}</span> correct.
            </p>
            <ul className="text-left text-sm space-y-1 mb-4 max-h-56 overflow-auto">
              {placed.map((p, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span>{p.ok ? "✅" : "❌"}</span>
                  <span className="text-lg">{p.animal.emoji}</span>
                  <span className="font-semibold">{p.animal.name}</span>
                  <span className="text-muted-foreground ml-auto">
                    {p.ok ? p.animal.group : `${p.picked} → ${p.animal.group}`}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={reset} className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold">
              Play again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
