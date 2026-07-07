import { Link } from "react-router-dom";
import { StudentHeader } from "@/components/student-header";

const GAMES = [
  { to: "/games/quizmatch", emoji: "🎯", title: "Match It!", desc: "Answer picture questions your teacher made", color: "var(--food-chain)" },
  { to: "/games/arrange", emoji: "🔢", title: "Arrange the Order", desc: "Drag pictures into the right food chain order", color: "var(--herbivore)" },
  { to: "/games/traceanimal", emoji: "✏️", title: "Trace the Animal", desc: "Trace the outline, then guess what it eats", color: "var(--carnivore)" },
  { to: "/games/connect", emoji: "🔗", title: "Connect the Pairs", desc: "Draw a line between matching pictures", color: "var(--omnivore)" },
  { to: "/games/jigsaw", emoji: "🧩", title: "Jigsaw Puzzle", desc: "Rebuild a food chain picture", color: "var(--food-chain)" },
  { to: "/games/memory", emoji: "🧠", title: "Memory Flip", desc: "Match the pairs of animals & plants", color: "var(--herbivore)" },
  { to: "/games/quiz", emoji: "⚡", title: "Quiz Rush", desc: "Beat the clock, build a streak", color: "var(--carnivore)" },
  { to: "/games/label", emoji: "🏷️", title: "Sort the Eaters", desc: "Sort each animal as herbivore, carnivore, or omnivore", color: "var(--omnivore)" },
] as const;

function GamesHub() {
  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-2">
          Pick a <span className="text-primary">game</span> 🎮
        </h1>
        <p className="text-center text-muted-foreground mb-8">Earn stars and badges as you play!</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {GAMES.map((g) => (
            <Link
              key={g.to}
              to={g.to}
              className="rounded-3xl p-5 border-2 bg-card hover:shadow-md hover:-translate-y-0.5 transition flex items-center gap-4"
              style={{ borderColor: g.color }}
            >
              <div
                className="size-16 rounded-2xl grid place-items-center text-4xl shrink-0"
                style={{ background: `color-mix(in oklab, ${g.color} 18%, transparent)` }}
              >
                {g.emoji}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{g.title}</h2>
                <p className="text-sm text-muted-foreground">{g.desc}</p>
              </div>
              <span className="text-2xl text-muted-foreground">→</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}


export default GamesHub;
