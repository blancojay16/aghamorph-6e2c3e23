import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/teacher/students")({
  component: TeacherStudents,
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

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 2);
}

function TeacherStudents() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: students = [] } = useQuery({
    queryKey: ["teacher-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,name,score,created_at,updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10_000,
  });

  // Group by shared name tokens to surface duplicates.
  const dupGroups = new Map<string, string[]>();
  for (const s of students) {
    for (const t of tokens(s.name)) {
      const arr = dupGroups.get(t) ?? [];
      arr.push(s.id);
      dupGroups.set(t, arr);
    }
  }
  const dupIds = new Set<string>();
  for (const ids of dupGroups.values()) {
    if (ids.length > 1) ids.forEach((id) => dupIds.add(id));
  }

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete student "${name}"? This also clears their answer history.`)) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Student deleted");
    if (selectedId === id) setSelectedId(null);
    qc.invalidateQueries({ queryKey: ["teacher-students"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link to="/teacher" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
      </div>

      {dupIds.size > 0 && (
        <div className="mb-4 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 text-sm">
          ⚠️ <strong>{dupIds.size}</strong> student{dupIds.size === 1 ? "" : "s"} share a first or last
          name with another entry. Delete the old one so the new student can sign up.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ul className="space-y-2">
          {students.length === 0 && (
            <li className="text-sm text-muted-foreground">No students yet.</li>
          )}
          {students.map((s) => {
            const isDup = dupIds.has(s.id);
            const isSel = selectedId === s.id;
            return (
              <li
                key={s.id}
                className={`bg-card border rounded-2xl p-3 flex items-center gap-3 ${
                  isSel ? "ring-2 ring-primary" : ""
                } ${isDup ? "border-destructive/60" : ""}`}
              >
                <button
                  onClick={() => setSelectedId(s.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ⭐ {s.score} · {new Date(s.created_at).toLocaleDateString()}
                    {isDup && <span className="ml-2 text-destructive font-bold">· duplicate</span>}
                  </p>
                </button>
                <button
                  onClick={() => remove(s.id, s.name)}
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
            <StudentAnswers
              studentId={selectedId}
              studentName={students.find((s) => s.id === selectedId)?.name ?? ""}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              Click a student to see the lessons they took and which questions they got right or wrong.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentAnswers({ studentId, studentName }: { studentId: string; studentName: string }) {
  const { data: answers = [], isLoading } = useQuery({
    queryKey: ["student-answers", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_answers")
        .select("*")
        .eq("student_id", studentId)
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
        {studentName} hasn't answered any lesson questions yet.
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
      <h2 className="font-bold text-lg mb-1">{studentName}</h2>
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
                        <li
                          key={i}
                          className={`px-2 py-1 rounded text-xs ${cls}`}
                        >
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
