import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEMS, systemMeta, type BodySystem } from "@/lib/systems";
import { useTeacherSession } from "@/hooks/use-teacher-session";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/")({
  component: TeacherDashboard,
});

function TeacherDashboard() {
  const { session } = useTeacherSession();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [system, setSystem] = useState<BodySystem>("skeletal");
  const [file, setFile] = useState<File | null>(null);

  const { data: videos = [] } = useQuery({
    queryKey: ["teacher-videos", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id,title,system,file_path,created_at")
        .eq("owner_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session) return;
    setUploading(true);
    try {
      const path = `${session.user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: row, error: insErr } = await supabase
        .from("videos")
        .insert({ title, system, file_path: path, owner_id: session.user.id })
        .select()
        .single();
      if (insErr) throw insErr;
      toast.success("Video uploaded!");
      setTitle("");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["teacher-videos"] });
      navigate({ to: "/teacher/video/$videoId", params: { videoId: row.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string, path: string) => {
    if (!confirm("Delete this video and all its checkpoints?")) return;
    await supabase.storage.from("videos").remove([path]);
    await supabase.from("videos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["teacher-videos"] });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-2xl font-bold mb-4">Your videos</h1>
        {videos.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No videos yet. Upload one to get started →</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {videos.map((v) => {
              const meta = systemMeta(v.system as BodySystem);
              return (
                <li key={v.id} className="bg-card rounded-2xl p-4 flex items-center gap-3 border">
                  <div
                    className="size-12 rounded-xl grid place-items-center text-2xl"
                    style={{ background: `color-mix(in oklab, ${meta.colorVar} 18%, transparent)` }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{meta.label} system</p>
                  </div>
                  <Link
                    to="/teacher/video/$videoId"
                    params={{ videoId: v.id }}
                    className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => remove(v.id, v.file_path)}
                    className="px-3 py-2 rounded-full bg-muted text-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <StudentsLeaderboard />
      </section>
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No videos yet. Upload one to get started →</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {videos.map((v) => {
              const meta = systemMeta(v.system as BodySystem);
              return (
                <li key={v.id} className="bg-card rounded-2xl p-4 flex items-center gap-3 border">
                  <div
                    className="size-12 rounded-xl grid place-items-center text-2xl"
                    style={{ background: `color-mix(in oklab, ${meta.colorVar} 18%, transparent)` }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{meta.label} system</p>
                  </div>
                  <Link
                    to="/teacher/video/$videoId"
                    params={{ videoId: v.id }}
                    className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => remove(v.id, v.file_path)}
                    className="px-3 py-2 rounded-full bg-muted text-sm hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="bg-card rounded-2xl p-5 border h-fit sticky top-4">
        <h2 className="font-bold text-lg mb-3">Upload new video</h2>
        <form onSubmit={upload} className="space-y-3">
          <input
            required
            placeholder="Title (e.g. How bones grow)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
          <button
            disabled={uploading || !file}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
      </aside>
    </div>
  );
}
