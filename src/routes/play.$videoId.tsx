import { Link, useHistory, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { StudentHeader } from "@/components/student-header";
import { systemMeta, type BodySystem } from "@/lib/systems";
import { addScore, markVideoComplete, awardBadge } from "@/lib/progress";
import {
  cacheVideoBlob,
  getCachedCheckpoints,
  getCachedQuiz,
  getCachedVideoBlob,
  getCachedVideoMeta,
} from "@/lib/offline-cache";

interface Checkpoint {
  id: string;
  ts_seconds: number;
  prompt: string;
  options: string[];
  correct_index: number;
}
interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correct_index: number;
}
interface PageData {
  video: { id: string; title: string; system: string; file_path: string };
  url: string | null;
  checkpoints: Checkpoint[];
  quiz: QuizQuestion[];
}

function PlayPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const history = useHistory();

  const { data, isLoading } = useQuery<PageData | null>({
    queryKey: ["video", videoId],
    queryFn: async () => {
      // Try online first, fall back to cache
      try {
        const [
          { data: video, error: ve },
          { data: cps, error: ce },
          { data: qz, error: qe },
        ] = await Promise.all([
          supabase.from("videos").select("*").eq("id", videoId).single(),
          supabase.from("checkpoints").select("*").eq("video_id", videoId).order("ts_seconds"),
          supabase.from("quiz_questions").select("*").eq("video_id", videoId).order("position"),
        ]);
        if (ve || ce || qe) throw ve || ce || qe;
        const { data: pub } = supabase.storage.from("videos").getPublicUrl(video.file_path);
        return {
          video,
          url: pub.publicUrl,
          checkpoints: (cps ?? []).map((c) => ({
            ...c,
            options: Array.isArray(c.options) ? (c.options as string[]) : [],
          })) as Checkpoint[],
          quiz: (qz ?? []).map((q) => ({
            id: q.id,
            prompt: q.prompt,
            correct_index: q.correct_index,
            options: Array.isArray(q.options) ? (q.options as string[]) : [],
          })) as QuizQuestion[],
        };
      } catch {
        const cachedMeta = await getCachedVideoMeta(videoId);
        if (!cachedMeta) return null;
        const cps = await getCachedCheckpoints(videoId);
        const qz = await getCachedQuiz(videoId);
        return {
          video: cachedMeta,
          url: null,
          checkpoints: cps as Checkpoint[],
          quiz: qz as QuizQuestion[],
        };
      }
    },
  });

  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      const cached = await getCachedVideoBlob(videoId);
      if (cached && !cancelled) {
        objectUrl = URL.createObjectURL(cached);
        setSrcUrl(objectUrl);
        return;
      }
      if (data?.url && !cancelled) {
        setSrcUrl(data.url);
        try {
          const res = await fetch(data.url);
          if (res.ok) {
            const blob = await res.blob();
            await cacheVideoBlob(videoId, blob, blob.type || "video/mp4");
          }
        } catch {
          /* offline — ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoId, data?.url]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const answeredRef = useRef<Set<string>>(new Set());
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

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
      if (data.quiz.length > 0) setShowQuiz(true);
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [data, activeCheckpoint, videoId]);

  const answer = (idx: number) => {
    if (!activeCheckpoint || pickedIndex !== null) return;
    setPickedIndex(idx);
    const correct = idx === activeCheckpoint.correct_index;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) addScore(1);
    setTimeout(() => {
      answeredRef.current.add(activeCheckpoint.id);
      setActiveCheckpoint(null);
      setPickedIndex(null);
      setFeedback(null);
      videoRef.current?.play();
    }, 900);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <StudentHeader />
        <main className="mx-auto max-w-3xl px-4 py-8 text-center text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <StudentHeader />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-muted-foreground">This lesson isn't available offline yet.</p>
          <Link to="/student" className="text-primary underline">Back to lessons</Link>
        </main>
      </div>
    );
  }

  const meta = systemMeta(data.video.system as BodySystem);

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <button onClick={() => history.push("/student")} className="text-sm text-muted-foreground hover:text-foreground mb-2">
          ← Back
        </button>
        <h1 className="text-2xl font-extrabold mb-2 flex items-center gap-2">
          <span>{meta.emoji}</span>
          {data.video.title}
        </h1>

        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
          {srcUrl ? (
            <video ref={videoRef} src={srcUrl} controls playsInline className="w-full h-full" />
          ) : (
            <div className="w-full h-full grid place-items-center text-white/60">Preparing…</div>
          )}
        </div>

        {showQuiz && (
          <div className="mt-6 bg-card border rounded-2xl p-4">
            <p className="font-bold mb-2">🎉 Lesson complete!</p>
            <p className="text-sm text-muted-foreground mb-3">
              Try the games to earn more points.
            </p>
            <Link to="/games" className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold">
              Play games →
            </Link>
          </div>
        )}
      </main>

      {activeCheckpoint && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur grid place-items-center p-6 overflow-auto">
          <div className="w-full max-w-3xl text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Checkpoint</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-8">{activeCheckpoint.prompt}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {activeCheckpoint.options.map((o, i) => {
                const isPicked = pickedIndex === i;
                const isRight = i === activeCheckpoint.correct_index;
                let cls = "bg-card border-4 border-transparent hover:border-primary";
                if (feedback && isRight) cls = "bg-[oklch(0.85_0.15_145)] text-foreground border-4 border-[oklch(0.6_0.2_145)]";
                else if (feedback && isPicked && !isRight) cls = "bg-destructive text-destructive-foreground border-4 border-destructive";
                return (
                  <button key={i} disabled={pickedIndex !== null} onClick={() => answer(i)}
                    className={`px-6 py-6 rounded-2xl text-xl md:text-2xl font-bold transition ${cls}`}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayPage;
