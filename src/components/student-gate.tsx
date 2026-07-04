import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clearStudent, loadStudent, saveStudent, type StudentRecord } from "@/lib/student";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function StudentGate({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    setStudent(loadStudent());
    setReady(true);
    const u = () => setStudent(loadStudent());
    window.addEventListener("aghamorph:student", u);
    return () => window.removeEventListener("aghamorph:student", u);
  }, []);

  // If the teacher deletes this group, reset locally.
  useEffect(() => {
    if (!student) return;
    let cancelled = false;
    const check = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id")
        .eq("id", student.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error && !data) {
        clearStudent();
        toast.info("Your teacher reset this group. Please pick your group again.");
      }
    };
    check();
    const t = setInterval(check, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [student]);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["group-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id,name,created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: ready && !student,
    refetchInterval: 10_000,
  });

  if (!ready) return null;
  if (student) return <>{children}</>;

  const pick = (g: { id: string; name: string }) => {
    saveStudent({ id: g.id, name: g.name });
    setStudent({ id: g.id, name: g.name });
    qc.invalidateQueries({ queryKey: ["group-list"] });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background to-secondary/40">
      <div className="w-full max-w-md bg-card rounded-3xl p-6 border shadow-xl text-center">
        <div className="text-5xl mb-2">👥</div>
        <h1 className="text-2xl font-extrabold mb-1">Pick your group</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Tap the group number your teacher assigned you.
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading groups…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No groups yet. Ask your teacher to add groups from the Teacher tab.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => pick(g)}
                className="rounded-2xl border-2 border-primary/40 bg-background hover:bg-primary hover:text-primary-foreground font-bold py-4 px-2 text-base transition"
              >
                {g.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
