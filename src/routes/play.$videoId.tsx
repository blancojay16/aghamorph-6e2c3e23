import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { StudentHeader } from "@/components/student-header";
import { systemMeta, type BodySystem } from "@/lib/systems";
import { addScore, markVideoComplete, awardBadge } from "@/lib/progress";
import { loadStudent } from "@/lib/student";

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

interface QuizQuestion {
  id: string;
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
      const [{ data: video, error: ve }, { data: cps, error: ce }, { data: qz, error: qe }] = await Promise.all([
        supabase.from("videos").select("*").eq("id", videoId).single(),
        supabase.from("checkpoints").select("*").eq("video_id", videoId).order("ts_seconds"),
        supabase.from("quiz_questions").select("*").eq("video_id", videoId).order("position"),
      ]);
      if (ve) throw ve;
      if (ce) throw ce;
      if (qe) throw qe;
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
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const answeredRef = useRef<Set<string>>(new Set());
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [retakeKey, setRetakeKey] = useState(0);
  const [fsElement, setFsElement] = useState<Element | null>(null);
  const [orientation, setOrientation] = useState<"landscape" | "portrait" | null>(null);

  useEffect(() => {
    const onFsChange = () => setFsElement(document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
  }, [data, activeCheckpoint, videoId, retakeKey]);

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
    setPickedIndex(idx);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) addScore(1);
    const student = loadStudent();
    if (student) {
      void supabase.from("student_answers").insert({
        student_id: student.id,
        video_id: videoId,
        video_title: data.video.title,
        source: "checkpoint",
        question_id: activeCheckpoint.id,
        prompt: activeCheckpoint.prompt,
        options: activeCheckpoint.options,
        picked_index: idx,
        correct_index: activeCheckpoint.correct_index,
        is_correct: correct,
      });
    }
  };

  const dismiss = () => {
    if (activeCheckpoint) answeredRef.current.add(activeCheckpoint.id);
    setActiveCheckpoint(null);
    setFeedback(null);
    setPickedIndex(null);
    videoRef.current?.play().catch(() => {});
  };

  const retake = () => {
    answeredRef.current = new Set();
    setActiveCheckpoint(null);
    setFeedback(null);
    setPickedIndex(null);
    setShowQuiz(false);
    setRetakeKey((k) => k + 1);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  // When an overlay needs to show but the <video> is in native fullscreen,
  // swap fullscreen to the wrapper so the overlay is visible.
  useEffect(() => {
    const needsOverlay = !!activeCheckpoint || showQuiz;
    if (!needsOverlay) return;
    if (fsElement === videoRef.current && wrapperRef.current) {
      const w = wrapperRef.current;
      document.exitFullscreen().then(() => w.requestFullscreen?.()).catch(() => {});
    }
  }, [activeCheckpoint, showQuiz, fsElement]);

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

        <div
          ref={wrapperRef}
          className={`relative rounded-2xl overflow-hidden bg-black mx-auto [&:fullscreen]:rounded-none [&:fullscreen]:aspect-auto [&:fullscreen]:w-screen [&:fullscreen]:h-screen [&:fullscreen]:max-w-none ${
            orientation === "portrait"
              ? "aspect-[9/16] max-w-[min(100%,420px)]"
              : "aspect-video w-full"
          }`}
        >
          <video
            ref={videoRef}
            src={data.url}
            controls
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                setOrientation(v.videoHeight > v.videoWidth ? "portrait" : "landscape");
              }
            }}
            className={`w-full h-full ${orientation === "portrait" ? "object-contain" : "object-contain"}`}
          />
          {activeCheckpoint && (
            <CheckpointSheet
              cp={activeCheckpoint}
              feedback={feedback}
              pickedIndex={pickedIndex}
              onAnswer={onAnswer}
              onContinue={dismiss}
            />
          )}
          {showQuiz && (
            <FinalQuiz
              questions={data.quiz}
              onClose={() => setShowQuiz(false)}
              onRetake={retake}
            />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {data.checkpoints.length} checkpoint{data.checkpoints.length === 1 ? "" : "s"} · {data.quiz.length} quiz question{data.quiz.length === 1 ? "" : "s"}
          </p>
          <button
            onClick={retake}
            className="text-sm px-4 py-2 rounded-full bg-muted hover:bg-secondary font-semibold"
          >
            ↻ Retake lesson
          </button>
        </div>

        <div className="mt-6 flex gap-3 justify-center flex-wrap">
          {data.quiz.length > 0 && (
            <button
              onClick={() => setShowQuiz(true)}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Take quiz →
            </button>
          )}
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
  pickedIndex,
  onAnswer,
  onContinue,
}: {
  cp: Checkpoint;
  feedback: "correct" | "wrong" | null;
  pickedIndex: number | null;
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
            const isPicked = i === pickedIndex;
            const show = feedback !== null;
            const cls = !show
              ? "bg-muted hover:bg-secondary"
              : isCorrect
                ? "bg-[oklch(0.85_0.15_145)] text-foreground"
                : isPicked
                  ? "bg-destructive text-destructive-foreground"
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

function FinalQuiz({
  questions,
  onClose,
  onRetake,
}: {
  questions: QuizQuestion[];
  onClose: () => void;
  onRetake: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const awardedRef = useRef(false);

  const q = questions[idx];

  const submit = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correct_index) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      if (!awardedRef.current) {
        const finalScore = score + (picked === q.correct_index ? 0 : 0);
        addScore(finalScore * 3);
        awardedRef.current = true;
      }
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
        <div className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold mb-1">Quiz complete!</h2>
          <p className="text-muted-foreground mb-4">
            You scored <span className="font-bold text-foreground">{score} / {questions.length}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onRetake}
              className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-secondary font-semibold"
            >
              Retake lesson
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto">
      <div className="bg-card rounded-3xl p-6 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-primary font-bold">
            Lesson quiz · {idx + 1} / {questions.length}
          </p>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
            Close
          </button>
        </div>
        <h2 className="text-lg sm:text-xl font-bold mb-4">{q.prompt}</h2>
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const show = picked !== null;
            const isCorrect = i === q.correct_index;
            const isPicked = i === picked;
            const cls = !show
              ? "bg-muted hover:bg-secondary"
              : isCorrect
                ? "bg-[oklch(0.85_0.15_145)] text-foreground"
                : isPicked
                  ? "bg-destructive/20"
                  : "bg-muted opacity-60";
            return (
              <button
                key={i}
                disabled={picked !== null}
                onClick={() => submit(i)}
                className={`w-full text-left p-3 rounded-xl font-semibold transition text-sm sm:text-base ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <button
            onClick={next}
            className="mt-4 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
          >
            {idx + 1 < questions.length ? "Next question →" : "See results"}
          </button>
        )}
      </div>
    </div>
  );
}
