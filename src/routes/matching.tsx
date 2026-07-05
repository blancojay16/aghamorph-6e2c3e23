import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { SYSTEMS, type BodySystem } from "@/lib/systems";
import { addScore, awardBadge } from "@/lib/progress";
import { supabase } from "@/integrations/supabase/client";

interface Item {
  id: string;
  label: string;
  url: string;
  system: BodySystem;
}

const ROUND_SIZE = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MatchingGame() {
  const { data: pool = [], isLoading } = useQuery({
    queryKey: ["game-assets", "matching"],
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await (supabase
        .from("game_assets")
        .select("id,label,system,file_path") as any)
        .eq("game", "matching")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((a) => ({
        id: a.id,
        label: a.label,
        system: a.system as BodySystem,
        url: supabase.storage.from("videos").getPublicUrl(a.file_path).data.publicUrl,
      }));
    },
  });

  const [round, setRound] = useState(0);
  const items = useMemo(() => shuffle(pool).slice(0, ROUND_SIZE), [pool, round]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<BodySystem | null>(null);
  const [score, setScore] = useState(0);

  const current = items[idx];
  const done = !current && items.length > 0;

  const pick = (sys: BodySystem) => {
    if (picked || !current) return;
    setPicked(sys);
    const correct = sys === current.system;
    if (correct) {
      addScore(3);
      setScore((s) => s + 1);
    }
    setTimeout(() => {
      if (idx + 1 >= items.length) {
        if (score + (correct ? 1 : 0) >= 4) awardBadge(current.system);
      }
      setIdx((i) => i + 1);
      setPicked(null);
    }, 900);
  };

  const reset = () => {
    setRound((r) => r + 1);
    setIdx(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-center mb-2">Match it! 🎯</h1>
        <p className="text-center text-muted-foreground mb-6">
          Which food chain group does this belong to?
        </p>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">
              No game images yet. Ask your teacher to upload some in Teacher → 🧩 Game images.
            </p>
          </div>
        ) : done ? (
          <div className="rounded-3xl p-8 text-center bg-card border-2 border-primary">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Round complete!</h2>
            <p className="text-lg mb-5">
              You got <span className="font-bold text-primary">{score}/{items.length}</span> right.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold hover:scale-105 transition"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl p-6 mb-6 bg-card border-2 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Question {idx + 1} of {items.length}
              </p>
              <div className="mx-auto max-w-xs aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
                <img src={current.url} alt={current.label} className="w-full h-full object-cover" />
              </div>
              <p className="text-xl md:text-2xl font-bold">{current.label}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SYSTEMS.map((s) => {
                const isPicked = picked === s.key;
                const isCorrect = picked && s.key === current.system;
                const styleState =
                  picked && isCorrect
                    ? "ring-4 ring-[oklch(0.7_0.18_145)]"
                    : isPicked
                      ? "ring-4 ring-destructive opacity-70"
                      : "";
                return (
                  <button
                    key={s.key}
                    disabled={!!picked}
                    onClick={() => pick(s.key)}
                    className={`rounded-2xl p-4 border-2 bg-card hover:scale-105 transition text-center disabled:cursor-not-allowed ${styleState}`}
                    style={{ borderColor: s.colorVar }}
                  >
                    <div className="text-4xl mb-1">{s.emoji}</div>
                    <div className="font-bold">{s.label}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


export default MatchingGame;
