import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { systemMeta, type BodySystem } from "@/lib/systems";
import {
  deleteLocalCheckpoint,
  getCachedVideoBlob,
  getLocalVideo,
  localCheckpointsForVideo,
  queueCheckpoint,
  syncOnce,
} from "@/lib/offline-sync";
import type { LocalCheckpoint, LocalVideo } from "@/lib/offline-db";

export const Route = createFileRoute("/teacher/pending/$localId")({
  component: PendingEditor,
});

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function PendingEditor() {
  const { localId } = Route.useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<LocalVideo | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [cps, setCps] = useState<LocalCheckpoint[]>([]);
  const [currentTs, setCurrentTs] = useState(0);

  const [prompt, setPrompt] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  const refresh = async () => {
    const v = await getLocalVideo(localId);
    setVideo(v ?? null);
    setCps(await localCheckpointsForVideo({ videoLocalId: localId, videoRemoteId: v?.remoteId }));
  };

  useEffect(() => {
    refresh();
    const on = () => refresh();
    window.addEventListener("aghamorph:sync", on);
    return () => window.removeEventListener("aghamorph:sync", on);
     
  }, [localId]);

  useEffect(() => {
    let url: string | null = null;
    (async () => {
      const b = await getCachedVideoBlob(localId);
      if (b) {
        url = URL.createObjectURL(b);
        setBlobUrl(url);
      }
    })();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [localId]);

  const meta = useMemo(
    () => (video ? systemMeta(video.system as BodySystem) : null),
    [video],
  );

  const addCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = opts.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) return toast.error("Add at least 2 options");
    if (correct >= cleaned.length) return toast.error("Pick a valid correct answer");
    await queueCheckpoint({
      videoLocalId: localId,
      videoRemoteId: video?.remoteId ?? null,
      tsSeconds: currentTs,
      prompt,
      options: cleaned,
      correctIndex: correct,
    });
    setPrompt("");
    setOpts(["", "", "", ""]);
    setCorrect(0);
    toast.success("Checkpoint saved");
    void syncOnce();
    refresh();
  };

  if (!video) {
    return (
      <div>
        <Link to="/teacher" className="text-sm text-muted-foreground">← Back</Link>
        <p className="mt-6 text-muted-foreground">This offline video can't be found on this device.</p>
      </div>
    );
  }

  return (
    <div>
      <Link to="/teacher" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to videos
      </Link>
      <div className="flex items-center gap-3 mt-2 mb-4">
        <h1 className="text-2xl font-bold flex-1">{video.title}</h1>
        <span
          className={`text-xs px-2 py-1 rounded-full font-semibold ${
            video.syncStatus === "synced"
              ? "bg-primary/15 text-primary"
              : video.syncStatus === "error"
                ? "bg-destructive/15 text-destructive"
                : "bg-accent text-accent-foreground"
          }`}
        >
          {video.syncStatus === "synced"
            ? "✓ Synced"
            : video.syncStatus === "error"
              ? "Upload failed — retrying"
              : "Offline / uploading…"}
        </span>
      </div>
      {meta && (
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
          {meta.emoji} {meta.label}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            {blobUrl ? (
              <video
                ref={videoRef}
                src={blobUrl}
                controls
                onTimeUpdate={(e) => setCurrentTs(e.currentTarget.currentTime)}
                className="w-full h-full"
              />
            ) : (
              <div className="h-full grid place-items-center text-white/60 text-sm">
                Video blob not available on this device.
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Current time: <span className="font-mono">{fmt(currentTs)}</span>
          </p>

          <h2 className="font-bold mt-6 mb-2">Checkpoints ({cps.length})</h2>
          {cps.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet. Add one →</p>
          ) : (
            <ul className="space-y-2">
              {cps
                .slice()
                .sort((a, b) => a.tsSeconds - b.tsSeconds)
                .map((c) => (
                  <li
                    key={c.localId}
                    className="bg-card border rounded-xl p-3 flex items-start gap-3"
                  >
                    <button
                      onClick={() => {
                        if (videoRef.current) videoRef.current.currentTime = c.tsSeconds;
                      }}
                      className="font-mono text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                    >
                      {fmt(c.tsSeconds)}
                    </button>
                    <div className="flex-1">
                      <p className="font-semibold">{c.prompt}</p>
                      <p className="text-xs text-muted-foreground">
                        ✓ {c.options[c.correctIndex]}{" "}
                        <span
                          className={`ml-2 ${
                            c.syncStatus === "synced" ? "text-primary" : "text-accent-foreground"
                          }`}
                        >
                          {c.syncStatus === "synced" ? "· synced" : "· pending"}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => deleteLocalCheckpoint(c.localId).then(refresh)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <aside className="bg-card rounded-2xl p-5 border h-fit space-y-3">
          <h2 className="font-bold">Add checkpoint</h2>
          <p className="text-xs text-muted-foreground">
            The video will pause at <span className="font-mono">{fmt(currentTs)}</span> and show this
            question. Works offline — uploads when you're online.
          </p>
          <form onSubmit={addCheckpoint} className="space-y-3">
            <textarea
              required
              placeholder="Question prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none min-h-[70px]"
            />
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  className="size-4"
                />
                <input
                  placeholder={`Option ${i + 1}${i < 2 ? " (required)" : ""}`}
                  value={o}
                  onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))}
                  className="flex-1 px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none"
                />
              </div>
            ))}
            <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold">
              Add at {fmt(currentTs)}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
