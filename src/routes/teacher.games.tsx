import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEMS, type BodySystem } from "@/lib/systems";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/games")({
  component: TeacherGames,
});

type GameKey = "jigsaw" | "memory" | "matching";

const GAMES: { key: GameKey; label: string; emoji: string; hint: string }[] = [
  { key: "jigsaw", label: "Jigsaw Puzzle", emoji: "🧩", hint: "Square images work best. They'll be cut into a 3×3 puzzle." },
  { key: "memory", label: "Memory Flip", emoji: "🧠", hint: "Each image is paired with its label. Upload at least 6 for a full deck." },
  { key: "matching", label: "Match It!", emoji: "🎯", hint: "Students guess the body system for each image." },
];

function TeacherGames() {
  const [game, setGame] = useState<GameKey>("jigsaw");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Game images 🧩</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Each game has its own image library. Pick a game tab to manage its pictures.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {GAMES.map((g) => (
          <button
            key={g.key}
            onClick={() => setGame(g.key)}
            className={`px-4 py-2 rounded-full border-2 font-bold text-sm ${
              game === g.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted"
            }`}
          >
            {g.emoji} {g.label}
          </button>
        ))}
      </div>

      <GamePanel game={game} hint={GAMES.find((g) => g.key === game)!.hint} />
    </div>
  );
}

function GamePanel({ game, hint }: { game: GameKey; hint: string }) {
  const qc = useQueryClient();
  const [system, setSystem] = useState<BodySystem>("skeletal");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: assets = [] } = useQuery({
    queryKey: ["game-assets", game],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("game_assets")
        .select("*") as any)
        .eq("game", game)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((a) => ({
        ...a,
        url: supabase.storage.from("videos").getPublicUrl(a.file_path).data.publicUrl,
      }));
    },
  });

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label.trim()) return;
    setUploading(true);
    try {
      const path = `game-assets/${game}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("game_assets")
        .insert({ system, label: label.trim(), file_path: path, game } as any);
      if (insErr) throw insErr;
      toast.success("Image uploaded!");
      setLabel("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["game-assets", game] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string, path: string) => {
    if (!confirm("Delete this image?")) return;
    await supabase.storage.from("videos").remove([path]);
    await supabase.from("game_assets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["game-assets", game] });
  };

  const grouped = SYSTEMS.map((s) => ({
    system: s,
    items: assets.filter((a) => a.system === s.key),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="space-y-6">
          {grouped.map(({ system: s, items }) => (
            <div key={s.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.emoji}</span>
                <h2 className="font-bold">{s.label}</h2>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </div>
              {items.length === 0 ? (
                <div className="rounded-xl bg-card border-2 border-dashed p-4 text-sm text-muted-foreground">
                  No images yet.
                </div>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items.map((a) => (
                    <li key={a.id} className="bg-card rounded-xl overflow-hidden border">
                      <div className="aspect-square bg-muted">
                        <img src={a.url} alt={a.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 flex items-center gap-2">
                        <span className="flex-1 text-sm font-semibold truncate">{a.label}</span>
                        <button
                          onClick={() => remove(a.id, a.file_path)}
                          className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <aside className="bg-card rounded-2xl p-5 border h-fit sticky top-4">
        <h2 className="font-bold text-lg mb-3">Upload image</h2>
        <form onSubmit={upload} className="space-y-3">
          <input
            required
            placeholder="Label (e.g. Heart)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none"
          />
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value as BodySystem)}
            className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none"
          >
            {SYSTEMS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <button
            disabled={uploading || !file}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </form>
      </aside>
    </div>
  );
}
