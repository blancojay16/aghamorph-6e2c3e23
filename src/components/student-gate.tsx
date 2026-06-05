import { useEffect, useState } from "react";
import { DuplicateNameError, loadStudent, registerStudent, type StudentRecord } from "@/lib/student";
import { toast } from "sonner";

export function StudentGate({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStudent(loadStudent());
    setReady(true);
    const u = () => setStudent(loadStudent());
    window.addEventListener("aghamorph:student", u);
    return () => window.removeEventListener("aghamorph:student", u);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const rec = await registerStudent(name);
      setStudent(rec);
    } catch (err) {
      if (err instanceof DuplicateNameError) {
        toast.error("Name already exists", {
          description: `"${err.matched[0].name}" is already registered. Please ask your teacher to remove the existing student before signing up again.`,
          duration: 8000,
        });
      } else {
        toast.error((err as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;
  if (student) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background to-secondary/40">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-3xl p-6 border shadow-xl text-center">
        <div className="text-5xl mb-2">👋</div>
        <h1 className="text-2xl font-extrabold mb-1">What's your name?</h1>
        <p className="text-sm text-muted-foreground mb-5">
          So your teacher can see your score.
        </p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          placeholder="Your name"
          className="w-full px-4 py-3 rounded-xl border-2 bg-background focus:border-primary outline-none text-center text-lg"
        />
        <button
          type="submit"
          disabled={!name.trim() || submitting}
          className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Start learning"}
        </button>
      </form>
    </div>
  );
}
