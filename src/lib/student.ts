import { supabase } from "@/integrations/supabase/client";

const KEY = "aghamorph.student.v1";

export interface StudentRecord {
  id: string;
  name: string;
}

export function loadStudent(): StudentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StudentRecord) : null;
  } catch {
    return null;
  }
}

export function saveStudent(s: StudentRecord) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("aghamorph:student"));
}

export function clearStudent() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("aghamorph:student"));
}

export async function registerStudent(name: string): Promise<StudentRecord> {
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) throw new Error("Name required");
  const { data, error } = await supabase
    .from("students")
    .insert({ name: trimmed, score: 0 })
    .select("id,name")
    .single();
  if (error) throw error;
  const rec = { id: data.id, name: data.name };
  saveStudent(rec);
  return rec;
}

export async function syncScore(score: number) {
  const s = loadStudent();
  if (!s) return;
  await supabase
    .from("students")
    .update({ score, updated_at: new Date().toISOString() })
    .eq("id", s.id);
}
