import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question { id: string; prompt_image_path: string; question_text: string; }
interface Choice { id: string; question_id: string; image_path: string; is_correct: boolean; }

const publicUrl = (path: string) => supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;

async function uploadImage(file: File, folder: string) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
  const { error } = await supabase.storage.from("videos").upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export default function TeacherQuizMatch() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [qText, setQText] = useState("What do I eat?");
  const [promptFile, setPromptFile] = useState<File | null>(null);
  const [choiceFile, setChoiceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: questions = [] } = useQuery({
    queryKey: ["qm-questions"],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await (supabase.from("quiz_match_questions" as never) as any)
        .select("id,prompt_image_path,question_text").order("created_at");
      if (error) throw error; return data;
    },
  });

  const { data: choices = [] } = useQuery({
    queryKey: ["qm-choices", selected],
    enabled: !!selected,
    queryFn: async (): Promise<Choice[]> => {
      const { data, error } = await (supabase.from("quiz_match_choices" as never) as any)
        .select("id,question_id,image_path,is_correct").eq("question_id", selected).order("created_at");
      if (error) throw error; return data;
    },
  });

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptFile) return;
    setBusy(true);
    try {
      const path = await uploadImage(promptFile, "quizmatch/prompts");
      const { data, error } = await (supabase.from("quiz_match_questions" as never) as any)
        .insert({ prompt_image_path: path, question_text: qText.trim() || "What do I eat?" })
        .select().single();
      if (error) throw error;
      setSelected(data.id); setPromptFile(null);
      const el = document.getElementById("qm-prompt-file") as HTMLInputElement | null;
      if (el) el.value = "";
      qc.invalidateQueries({ queryKey: ["qm-questions"] });
      toast.success("Question created — now add choices");
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  const addChoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choiceFile || !selected) return;
    setBusy(true);
    try {
      const path = await uploadImage(choiceFile, "quizmatch/choices");
      const { error } = await (supabase.from("quiz_match_choices" as never) as any)
        .insert({ question_id: selected, image_path: path, is_correct: false });
      if (error) throw error;
      setChoiceFile(null);
      const el = document.getElementById("qm-choice-file") as HTMLInputElement | null;
      if (el) el.value = "";
      qc.invalidateQueries({ queryKey: ["qm-choices", selected] });
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  const setCorrect = async (choiceId: string) => {
    if (!selected) return;
    await (supabase.from("quiz_match_choices" as never) as any).update({ is_correct: false }).eq("question_id", selected);
    await (supabase.from("quiz_match_choices" as never) as any).update({ is_correct: true }).eq("id", choiceId);
    qc.invalidateQueries({ queryKey: ["qm-choices", selected] });
  };

  const deleteChoice = async (c: Choice) => {
    await supabase.storage.from("videos").remove([c.image_path]);
    await (supabase.from("quiz_match_choices" as never) as any).delete().eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["qm-choices", selected] });
  };

  const deleteQuestion = async (q: Question) => {
    if (!confirm("Delete this question and all its choices?")) return;
    await supabase.storage.from("videos").remove([q.prompt_image_path]);
    await (supabase.from("quiz_match_questions" as never) as any).delete().eq("id", q.id);
    if (selected === q.id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["qm-questions"] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🎯 Quiz Match questions</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a prompt image (e.g. a frog), the question text, and 2–4 answer images. Mark one as correct.
      </p>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="bg-card border rounded-2xl p-4">
          <h2 className="font-bold mb-2">Questions</h2>
          <form onSubmit={createQuestion} className="space-y-2 mb-3">
            <input value={qText} onChange={(e) => setQText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none text-sm"
              placeholder="Question text" />
            <input id="qm-prompt-file" required type="file" accept="image/*"
              onChange={(e) => setPromptFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
            <button disabled={busy || !promptFile}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
              {busy ? "Uploading…" : "Add question"}
            </button>
          </form>
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${selected === q.id ? "bg-primary/10" : "bg-muted/40"}`}>
                <img src={publicUrl(q.prompt_image_path)} alt="" className="size-10 rounded object-cover bg-muted" />
                <button className="flex-1 text-left text-sm font-semibold truncate" onClick={() => setSelected(q.id)}>
                  {q.question_text}
                </button>
                <button className="text-xs text-destructive" onClick={() => deleteQuestion(q)}>×</button>
              </li>
            ))}
            {questions.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
          </ul>
        </div>

        <div className="bg-card border rounded-2xl p-4 min-h-[300px]">
          {!selected ? (
            <p className="text-sm text-muted-foreground text-center py-10">Pick or create a question.</p>
          ) : (
            <>
              <h2 className="font-bold mb-3">Choices ({choices.length}) — click a choice to mark it correct</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {choices.map((c) => (
                  <div key={c.id}
                    className={`rounded-xl border-4 p-2 bg-background ${c.is_correct ? "border-primary" : "border-transparent"}`}>
                    <img src={publicUrl(c.image_path)} alt="" className="w-full aspect-square object-cover rounded-lg bg-muted" />
                    <div className="flex gap-1 mt-2">
                      <button onClick={() => setCorrect(c.id)}
                        className={`flex-1 text-xs px-2 py-1 rounded font-bold ${c.is_correct ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {c.is_correct ? "✓ Correct" : "Mark correct"}
                      </button>
                      <button onClick={() => deleteChoice(c)} className="text-xs px-2 py-1 rounded bg-muted text-destructive">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={addChoice} className="border-t pt-3 flex flex-wrap items-end gap-2">
                <input id="qm-choice-file" required type="file" accept="image/*"
                  onChange={(e) => setChoiceFile(e.target.files?.[0] ?? null)} className="flex-1 text-sm" />
                <button disabled={busy || !choiceFile}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
                  {busy ? "Uploading…" : "Add choice"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
