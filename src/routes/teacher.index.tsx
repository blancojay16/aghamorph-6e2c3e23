import { Link, useHistory } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEMS, systemMeta, type BodySystem } from "@/lib/systems";
import { toast } from "sonner";
import {
  deleteLocalVideo,
  listLocalVideos,
  queueVideo,
  syncOnce,
} from "@/lib/offline-sync";
import type { LocalVideo } from "@/lib/offline-db";

function TeacherDashboard() {
  const qc = useQueryClient();
  const history = useHistory();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [system, setSystem] = useState<BodySystem>("food_chain");
  const [file, setFile] = useState<File | null>(null);
  const [locals, setLocals] = useState<LocalVideo[]>([]);

  const { data: videos = [] } = useQuery({
    queryKey: ["teacher-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id,title,system,file_path,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const refresh = async () => {
      try {
        setLocals(await listLocalVideos());
      } catch {
        /* IDB unavailable */
      }
    };
    refresh();
    const on = () => {
      refresh();
      qc.invalidateQueries({ queryKey: ["teacher-videos"] });
    };
    window.addEventListener("aghamorph:sync", on);
    return () => window.removeEventListener("aghamorph:sync", on);
  }, [qc]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const localId = await queueVideo({
        title,
        system,
        blob: file,
        mime: file.type || "video/mp4",
      });
      toast.success(
        navigator.onLine
          ? "Video saved. Uploading in background…"
          : "Saved offline. Will upload when back online.",
      );
      setTitle("");
      setFile(null);
      // Fire-and-forget sync; user goes to the local editor immediately
      void syncOnce();
      navigate({ to: "/teacher/pending/$localId", params: { localId } });
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

  const removeLocal = async (localId: string) => {
    if (!confirm("Delete this offline video?")) return;
    await deleteLocalVideo(localId);
    setLocals(await listLocalVideos());
  };

  const pendingLocals = locals.filter((l) => l.syncStatus !== "synced");
  const syncedRemoteIds = new Set(videos.map((v) => v.id));
  const syncedLocals = locals.filter(
    (l) => l.syncStatus === "synced" && l.remoteId && !syncedRemoteIds.has(l.remoteId),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="text-2xl font-bold mb-4">Your videos</h1>

        {pendingLocals.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Pending upload
            </p>
            <ul className="space-y-3">
              {pendingLocals.map((v) => {
                const meta = systemMeta(v.system as BodySystem);
                return (
                  <li
                    key={v.localId}
                    className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-dashed border-accent"
                  >
                    <div
                      className="size-12 rounded-xl grid place-items-center text-2xl"
                      style={{ background: `color-mix(in oklab, ${meta.colorVar} 18%, transparent)` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{v.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta.label} ·{" "}
                        {v.syncStatus === "error" ? (
                          <span className="text-destructive">Upload failed — will retry</span>
                        ) : (
                          <span className="text-accent-foreground">Offline / uploading…</span>
                        )}
                      </p>
                    </div>
                    <Link
                      to={`/teacher/pending/${v.localId}`}
                      className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                    >
                      Edit offline
                    </Link>
                    <button
                      onClick={() => removeLocal(v.localId)}
                      className="px-3 py-2 rounded-full bg-muted text-sm hover:bg-destructive hover:text-destructive-foreground"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {videos.length === 0 && syncedLocals.length === 0 && pendingLocals.length === 0 ? (
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
                    <p className="text-xs text-muted-foreground">{meta.label}</p>
                  </div>
                  <Link
                    to={`/teacher/video/${v.id}`}
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
        <h2 className="font-bold text-lg mb-1">Upload new video</h2>
        <p className="text-xs text-muted-foreground mb-3">
          Works offline — the video is saved to this device and uploads automatically when you're online.
        </p>
        <form onSubmit={upload} className="space-y-3">
          <input
            required
            placeholder="Title (e.g. Predator & prey)"
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
            {uploading ? "Saving…" : "Save & upload"}
          </button>
        </form>
      </aside>
    </div>
  );
}
