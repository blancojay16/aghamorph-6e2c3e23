import { supabase } from "@/integrations/supabase/client";
import { loadStudent } from "./student";

export type GameKey = "label" | "memory" | "jigsaw" | "quiz";

// Fire-and-forget: increment the current group's score for a game.
export async function awardGameScore(game: GameKey, delta = 1) {
  if (delta <= 0) return;
  const s = loadStudent();
  if (!s) return;
  try {
    const { data, error } = await supabase
      .from("group_game_scores" as never)
      .select("id,score")
      .eq("group_id" as never, s.id)
      .eq("game" as never, game)
      .maybeSingle();
    if (error) return;
    if (data) {
      await supabase
        .from("group_game_scores" as never)
        .update({ score: (data as any).score + delta } as never)
        .eq("id" as never, (data as any).id);
    } else {
      await supabase
        .from("group_game_scores" as never)
        .insert({ group_id: s.id, game, score: delta } as never);
    }
  } catch {
    // network offline — score still lives in local progress
  }
}
