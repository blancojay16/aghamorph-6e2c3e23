import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { supabase } from "@/integrations/supabase/client";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";

interface Question { id: string; prompt_image_path: string; question_text: string; }
interface Choice { id: string; question_id: string; image_path: string; is_correct: boolean; }

const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;
function shuffle<T>(arr: T[]): T[] { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

export default function QuizMatchGame() {
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["qm-play-questions"],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await (supabase.from("quiz_match_questions" as never) as any)
        .select("id,prompt_image_path,question_text");
      if (error) throw error; return data;
    },
  });
  const { data: allChoices = [] } = useQuery({
    queryKey: ["qm-play-choices"],
    queryFn: async (): Promise<Choice[]> => {
      const { data, error } = await (supabase.from("quiz_match_choices" as never) as any)
        .select("id,question_id,image_path,is_correct");
      if (error) throw error; return data;
    },
  });

  const [round, setRound] = useState(0);
  const ordered = useMemo(() => shuffle(questions), [questions, round]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const q = ordered[idx];
  const choices = useMemo(() => q ? shuffle(allChoices.filter((c) => c.question_id === q.id)) : [], [q, allChoices, round]);
  const done = ordered.length > 0 && idx >= ordered.length;

  const pick = (c: Choice) => {
    if (picked) return;
    setPicked(c.id);
    if (c.is_correct) { addScore(1); setScore((s) => s + 1); void awardGameScore("quizmatch" as any, 1); }
    setTimeout(() => { setIdx((i) => i + 1); setPicked(null); }, 900);
  };

  const reset = () => { setRound((r) => r + 1); setIdx(0); setScore(0); setPicked(null); };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Match It! 🎯</h1>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading…</p>
        ) : ordered.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No questions yet. Ask your teacher to add some in Teacher → Match It.</p>
          </div>
        ) : done ? (
          <div className="rounded-3xl p-8 text-center bg-card border-2 border-primary">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold mb-2">Round complete!</h2>
            <p className="text-lg mb-5">You got <span className="font-bold text-primary">{score}/{ordered.length}</span> right.</p>
            <button onClick={reset} className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold">Play again</button>
          </div>
        ) : q ? (
          <>
            <div className="rounded-3xl p-6 mb-6 bg-card border-2 text-center shadow-sm">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Question {idx + 1} of {ordered.length}</p>
              <div className="mx-auto max-w-xs aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
                <img src={publicUrl(q.prompt_image_path)} alt="" className="w-full h-full object-contain" />
              </div>
              <p className="text-xl md:text-2xl font-bold">{q.question_text}</p>
            </div>
            {choices.length === 0 ? (
              <p className="text-center text-muted-foreground">Teacher hasn't added choices for this question yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {choices.map((c) => {
                  const isPicked = picked === c.id;
                  const showCorrect = picked && c.is_correct;
                  const wrongPick = isPicked && !c.is_correct;
                  const cls = showCorrect ? "ring-4 ring-[oklch(0.7_0.18_145)]" : wrongPick ? "ring-4 ring-destructive opacity-70" : "";
                  return (
                    <button key={c.id} disabled={!!picked} onClick={() => pick(c)}
                      className={`rounded-2xl p-2 border-2 bg-card hover:scale-105 transition disabled:cursor-not-allowed ${cls}`}>
                      <img src={publicUrl(c.image_path)} alt="" className="w-full aspect-square object-contain rounded-xl bg-muted" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : null}
      </main>
    </div>
  );
}
