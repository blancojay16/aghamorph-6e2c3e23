import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/video/$videoId")({
  component: VideoEditor,
});

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoEditor() {
  const { videoId } = Route.useParams();
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTs, setCurrentTs] = useState(0);

  const { data } = useQuery({
    queryKey: ["teacher-video", videoId],
    queryFn: async () => {
      const [{ data: video, error: ve }, { data: cps, error: ce }, { data: qz, error: qe }] = await Promise.all([
        supabase.from("videos").select("*").eq("id", videoId).single(),
        supabase
          .from("checkpoints")
          .select("*")
          .eq("video_id", videoId)
          .order("ts_seconds"),
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("video_id", videoId)
          .order("position"),
      ]);
      if (ve) throw ve;
      if (ce) throw ce;
      if (qe) throw qe;
      const { data: pub } = supabase.storage.from("videos").getPublicUrl(video.file_path);
      return { video, url: pub.publicUrl, checkpoints: cps ?? [], quiz: qz ?? [] };
    },
  });

  const [prompt, setPrompt] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);

  const addCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = opts.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length < 2) return toast.error("Add at least 2 options");
    if (correct >= cleaned.length) return toast.error("Pick a valid correct answer");
    const { error } = await supabase.from("checkpoints").insert({
      video_id: videoId,
      ts_seconds: currentTs,
      prompt,
      options: cleaned,
      correct_index: correct,
    });
    if (error) return toast.error(error.message);
    toast.success("Checkpoint added");
    setPrompt("");
    setOpts(["", "", "", ""]);
    setCorrect(0);
    qc.invalidateQueries({ queryKey: ["teacher-video", videoId] });
  };

  const removeCp = async (id: string) => {
    await supabase.from("checkpoints").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["teacher-video", videoId] });
  };

  if (!data) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div>
      <Link to="/teacher" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to videos
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">{data.video.title}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={data.url}
              controls
              onTimeUpdate={(e) => setCurrentTs(e.currentTarget.currentTime)}
              className="w-full h-full"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Current time: <span className="font-mono">{fmt(currentTs)}</span>
          </p>

          <h2 className="font-bold mt-6 mb-2">Checkpoints ({data.checkpoints.length})</h2>
          {data.checkpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet. Add one →</p>
          ) : (
            <ul className="space-y-2">
              {data.checkpoints.map((c) => (
                <li key={c.id} className="bg-card border rounded-xl p-3 flex items-start gap-3">
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = Number(c.ts_seconds);
                    }}
                    className="font-mono text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                  >
                    {fmt(Number(c.ts_seconds))}
                  </button>
                  <div className="flex-1">
                    <p className="font-semibold">{c.prompt}</p>
                    <p className="text-xs text-muted-foreground">
                      ✓ {(c.options as string[])[c.correct_index]}
                    </p>

          <QuizManager videoId={videoId} quiz={data.quiz as QuizRow[]} />
        </div>
                  <button
                    onClick={() => removeCp(c.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-5">
          <ShareQR videoId={videoId} title={data.video.title} />
          <div className="bg-card rounded-2xl p-5 border h-fit">
          <h2 className="font-bold mb-3">Add checkpoint</h2>
          <p className="text-xs text-muted-foreground mb-3">
            The video will pause at <span className="font-mono">{fmt(currentTs)}</span> and show this question.
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
            <p className="text-xs text-muted-foreground">Radio = correct answer</p>
            <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold">
              Add at {fmt(currentTs)}
            </button>
          </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ShareQR({ videoId, title }: { videoId: string; title: string }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/play/${videoId}`
      : `/play/${videoId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const download = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#lesson-qr canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${title.replace(/[^a-z0-9-_]+/gi, "_")}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="bg-card rounded-2xl p-5 border">
      <h2 className="font-bold mb-1">Share with students</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Print or display this QR. Students scan it to open the lesson.
      </p>
      <div
        id="lesson-qr"
        className="grid place-items-center bg-white p-4 rounded-xl border"
      >
        <QRCodeCanvas value={url} size={196} includeMargin />
      </div>
      <p className="text-[11px] break-all text-muted-foreground mt-2 font-mono">{url}</p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={copy}
          className="flex-1 py-2 rounded-lg bg-muted hover:bg-secondary text-sm font-semibold"
        >
          Copy link
        </button>
        <button
          onClick={download}
          className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          Download QR
        </button>
      </div>
    </div>
  );
}

