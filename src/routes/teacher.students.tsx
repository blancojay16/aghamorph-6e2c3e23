import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/students")({
  component: TeacherGroups,
});

interface Answer {
  id: string;
  video_id: string;
  video_title: string;
  source: "checkpoint" | "quiz";
  prompt: string;
  options: string[];
  picked_index: number;
  correct_index: number;
  is_correct: boolean;
  created_at: string;
}

function nextGroupNumber(names: string[]): number {
  const used = new Set<number>();
  for (const n of names) {
    const m = /group\s*(\d+)/i.exec(n);
    if (m) used.add(Number(m[1]));
  }
  let i = 1;
  while (used.has(i)) i++;
  return i;
}

function TeacherGroups() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ["teacher-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,name,score,created_at,updated_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10_000,
  });

  const addGroup = async () => {
    setAdding(true);
    try {
      const n = nextGroupNumber(groups.map((g) => g.name));
      const { error } = await supabase
        .from("students")
        .insert({ name: `Group ${n}`, score: 0 });
      if (error) throw error;
      toast.success(`Group ${n} added`);
      qc.invalidateQueries({ queryKey: ["teacher-groups"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This also clears its answers and scores.`)) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Group deleted");
    if (selectedId === id) setSelectedId(null);
    qc.invalidateQueries({ queryKey: ["teacher-groups"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Groups</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/teacher/rankings"
            className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-secondary"
          >
            🏆 Rankings
          </Link>
          <button
            onClick={addGroup}
            disabled={adding}
            className="text-sm px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-60"
          >
            + Add group
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ul className="space-y-2">
          {groups.length === 0 && (
            <li className="text-sm text-muted-foreground">
              No groups yet. Tap <b>+ Add group</b> to create Group 1.
            </li>
          )}
          {groups.map((g) => {
            const isSel = selectedId === g.id;
            return (
              <li
                key={g.id}
                className={`bg-card border rounded-2xl p-3 flex items-center gap-3 ${
                  isSel ? "ring-2 ring-primary" : ""
                }`}
              >
                <button
                  onClick={() => setSelectedId(g.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-semibold truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {g.score} · added {new Date(g.created_at).toLocaleDateString()}
                  </p>
                </button>
                <button
                  onClick={() => remove(g.id, g.name)}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>

        <div className="bg-card border rounded-2xl p-4 min-h-[300px]">
          {selectedId ? (
            <GroupAnswers
              groupId={selectedId}
              groupName={groups.find((g) => g.id === selectedId)?.name ?? ""}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              Pick a group to see the lessons they took and which questions they got right or wrong.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupAnswers({ groupId, groupName }: { groupId: string; groupName: string }) {
  const { data: answers = [], isLoading } = useQuery({
    queryKey: ["group-answers", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_answers")
        .select("*")
        .eq("student_id", groupId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((a) => ({
        ...a,
        options: Array.isArray(a.options) ? (a.options as string[]) : [],
      })) as Answer[];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (answers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        {groupName} hasn't answered any lesson questions yet.
      </p>
    );
  }

  const byVideo = new Map<string, { title: string; items: Answer[] }>();
  for (const a of answers) {
    const g = byVideo.get(a.video_id) ?? { title: a.video_title, items: [] };
    g.items.push(a);
    byVideo.set(a.video_id, g);
  }

  return (
    <div>
      <h2 className="font-bold text-lg mb-1">{groupName}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {answers.length} answer{answers.length === 1 ? "" : "s"} across {byVideo.size} lesson
        {byVideo.size === 1 ? "" : "s"} ·{" "}
        <span className="text-foreground font-semibold">
          {answers.filter((a) => a.is_correct).length} correct
        </span>{" "}
        ·{" "}
        <span className="text-destructive font-semibold">
          {answers.filter((a) => !a.is_correct).length} wrong
        </span>
      </p>

      <div className="space-y-5">
        {Array.from(byVideo.entries()).map(([vid, group]) => (
          <div key={vid} className="rounded-xl border bg-background/40 p-3">
            <p className="font-semibold mb-2">🎬 {group.title}</p>
            <ul className="space-y-3">
              {group.items.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                        a.is_correct
                          ? "bg-[oklch(0.85_0.15_145)] text-foreground"
                          : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {a.is_correct ? "Correct" : "Wrong"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {a.source === "quiz" ? "Final quiz" : "Checkpoint"}
                    </span>
                  </div>
                  <p className="font-medium mb-1">{a.prompt}</p>
                  <ul className="space-y-1">
                    {a.options.map((opt, i) => {
                      const isPicked = i === a.picked_index;
                      const isCorrect = i === a.correct_index;
                      const cls = isCorrect
                        ? "bg-[oklch(0.85_0.15_145)] text-foreground"
                        : isPicked
                          ? "bg-destructive/20 text-foreground"
                          : "bg-muted/60";
                      return (
                        <li key={i} className={`px-2 py-1 rounded text-xs ${cls}`}>
                          {isPicked ? "👉 " : ""}
                          {opt}
                          {isCorrect ? "  ✓" : ""}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
