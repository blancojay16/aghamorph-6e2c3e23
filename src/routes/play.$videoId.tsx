import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentHeader } from "@/components/student-header";
import { systemMeta, type BodySystem } from "@/lib/systems";
import { addScore, markVideoComplete, awardBadge } from "@/lib/progress";

export const Route = createFileRoute("/play/$videoId")({
  component: PlayPage,
});

interface Checkpoint {
  id: string;
  ts_seconds: number;
  prompt: string;
  options: string[];
  correct_index: number;
}

function PlayPage() {
  const { videoId } = Route.useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const [{ data: video, error: ve }, { data: cps, error: ce }] = await Promise.all([
        supabase.from("videos").select("*").eq("id", videoId).single(),
        supabase.from("checkpoints").select("*").eq("video_id", videoId).order("ts_seconds"),
      ]);
      if (ve) throw ve;
      if (ce) throw ce;
      const { data: pub } = supabase.storage.from("videos").getPublicUrl(video.file_path);
      return {
        video,
        url: pub.publicUrl,
        checkpoints: (cps ?? []).map((c) => ({
          ...c,
          options: Array.isArray(c.options) ? (c.options as string[]) : [],
        })) as Checkpoint[],
      };
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const answeredRef = useRef<Set<string>>(new Set());
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  // Listen for playback time updates and pause at active checkpoints
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !data) return;
    const onTime = () => {
      if (activeCheckpoint) return;
      const t = v.currentTime;
      const cp = data.checkpoints.find(
        (c) => !answeredRef.current.has(c.id) && t >= c.ts_seconds,
      );
      if (cp) {
        v.pause();
        setActiveCheckpoint(cp);
      }
    };
    const onEnded = () => {
      markVideoComplete(videoId);
      awardBadge(data.video.system as BodySystem);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [data, activeCheckpoint, videoId]);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen">
        <StudentHeader />
        <div className="p-10 text-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const meta = systemMeta(data.video.system as BodySystem);

  const onAnswer = (idx: number) => {
    if (!activeCheckpoint) return;
    const correct = idx === activeCheckpoint.correct_index;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) addScore(5);
  };

  const dismiss = () => {
    if (activeCheckpoint) answeredRef.current.add(activeCheckpoint.id);
    setActiveCheckpoint(null);
    setFeedback(null);
    videoRef.current?.play().catch(() => {});
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to systems
        </Link>
        <div className="flex items-center gap-3 mt-3 mb-4">
          <div
            className="size-12 rounded-2xl grid place-items-center text-2xl"
            style={{ background: `color-mix(in oklab, ${meta.colorVar} 18%, transparent)` }}
          >
            {meta.emoji}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {meta.label} system
            </p>
            <h1 className="text-2xl font-bold">{data.video.title}</h1>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
          <video
            ref={videoRef}
            src={data.url}
            controls
            playsInline
            className="w-full h-full"
          />
          {activeCheckpoint && (
            <CheckpointSheet
              cp={activeCheckpoint}
              feedback={feedback}
              onAnswer={onAnswer}
              onContinue={dismiss}
            />
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-3">
          {data.checkpoints.length} checkpoint{data.checkpoints.length === 1 ? "" : "s"} in this video.
        </p>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate({ to: "/matching" })}
            className="px-5 py-2.5 rounded-full bg-secondary text-secondary-foreground font-semibold hover:bg-muted"
          >
            Play matching game →
          </button>
        </div>
      </main>
    </div>
  );
}

function CheckpointSheet({
  cp,
  feedback,
  onAnswer,
  onContinue,
}: {
  cp: Checkpoint;
  feedback: "correct" | "wrong" | null;
  onAnswer: (i: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-card text-card-foreground rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl my-auto">
        <p className="text-xs uppercase tracking-wider text-primary font-bold mb-2">
          Quick check
        </p>
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{cp.prompt}</h2>
        <div className="space-y-2">
          {cp.options.map((opt, i) => {
            const isCorrect = i === cp.correct_index;
            const show = feedback !== null;
            const cls = !show
              ? "bg-muted hover:bg-secondary"
              : isCorrect
                ? "bg-[oklch(0.85_0.15_145)] text-foreground"
                : "bg-muted opacity-60";
            return (
              <button
                key={i}
                disabled={feedback !== null}
                onClick={() => onAnswer(i)}
                className={`w-full text-left p-3 rounded-xl font-semibold transition text-sm sm:text-base ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {feedback && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="font-bold text-sm sm:text-base">
              {feedback === "correct" ? "Correct! +5 stars" : "Not quite — keep watching!"}
            </p>
            <button
              onClick={onContinue}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition text-sm sm:text-base whitespace-nowrap"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
