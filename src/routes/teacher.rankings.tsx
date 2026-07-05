import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const GAMES: { key: "label" | "memory" | "jigsaw" | "quiz"; label: string; emoji: string }[] = [
  { key: "label", emoji: "🏷️", label: "Sort the Eaters" },
  { key: "memory", emoji: "🧠", label: "Memory Flip" },
  { key: "jigsaw", emoji: "🧩", label: "Jigsaw Puzzle" },
  { key: "quiz", emoji: "⚡", label: "Quiz Rush" },
];

const MEDALS = ["🥇", "🥈", "🥉"];

interface Row {
  group_id: string;
  game: string;
  score: number;
}
interface Group {
  id: string;
  name: string;
}

function RankingsPage() {
  const { data: groups = [] } = useQuery({
    queryKey: ["ranking-groups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("id,name");
      if (error) throw error;
      return data as Group[];
    },
    refetchInterval: 10_000,
  });

  const { data: scores = [] } = useQuery({
    queryKey: ["ranking-scores"],
    queryFn: async () => {
      const { data, error } = await (supabase.from(
        "group_game_scores" as never,
      ) as any).select("group_id,game,score");
      if (error) throw error;
      return data as Row[];
    },
    refetchInterval: 10_000,
  });

  const groupName = (id: string) =>
    groups.find((g) => g.id === id)?.name ?? "Unknown";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🏆 Game Rankings</h1>
        <Link
          to="/teacher/students"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Groups
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {GAMES.map((g) => {
          const rows = scores
            .filter((s) => s.game === g.key && groups.some((gr) => gr.id === s.group_id))
            .sort((a, b) => b.score - a.score);
          return (
            <div key={g.key} className="bg-card border rounded-2xl p-4">
              <h2 className="font-bold text-lg mb-3">
                {g.emoji} {g.label}
              </h2>
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No scores yet. Groups will appear here as they play.
                </p>
              ) : (
                <ol className="space-y-2">
                  {rows.map((r, i) => (
                    <li
                      key={r.group_id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        i < 3 ? "bg-primary/10" : "bg-muted/40"
                      }`}
                    >
                      <span className="w-8 text-center text-xl">
                        {MEDALS[i] ?? `${i + 1}.`}
                      </span>
                      <span className="flex-1 font-semibold">
                        {groupName(r.group_id)}
                      </span>
                      <span className="font-bold text-primary">⭐ {r.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
