import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Set { id: string; title: string; }
interface Pair { id: string; set_id: string; left_image_path: string; right_image_path: string; }

const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;

export default function TeacherConnect() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: sets = [] } = useQuery({
    queryKey: ["conn-sets"],
    queryFn: async (): Promise<Set[]> => {
      const { data, error } = await (supabase.from("connect_sets" as never) as any)
        .select("id,title").order("created_at");
      if (error) throw error; return data;
    },
  });

  const { data: pairs = [] } = useQuery({
    queryKey: ["conn-pairs", selected],
    enabled: !!selected,
    queryFn: async (): Promise<Pair[]> => {
      const { data, error } = await (supabase.from("connect_pairs" as never) as any)
        .select("id,set_id,left_image_path,right_image_path").eq("set_id", selected).order("created_at");
      if (error) throw error; return data;
    },
  });

  const addSet = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await (supabase.from("connect_sets" as never) as any)
      .insert({ title: newTitle.trim() }).select().single();
    if (error) return toast.error(error.message);
    setNewTitle(""); setSelected(data.id);
    qc.invalidateQueries({ queryKey: ["conn-sets"] });
  };

  const removeSet = async (id: string) => {
    if (!confirm("Delete this set?")) return;
    await (supabase.from("connect_sets" as never) as any).delete().eq("id", id);
    if (selected === id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["conn-sets"] });
  };

  const addPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leftFile || !rightFile || !selected) return;
    setBusy(true);
    try {
      const up = async (f: File, side: string) => {
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `connect/${side}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${safe}`;
        const { error } = await supabase.storage.from("videos").upload(path, f, {
          cacheControl: "3600", upsert: false, contentType: f.type,
        });
        if (error) throw error;
        return path;
      };
      const left = await up(leftFile, "L");
      const right = await up(rightFile, "R");
      const { error } = await (supabase.from("connect_pairs" as never) as any)
        .insert({ set_id: selected, left_image_path: left, right_image_path: right });
      if (error) throw error;
      setLeftFile(null); setRightFile(null);
      (document.getElementById("conn-left") as HTMLInputElement | null)?.value && ((document.getElementById("conn-left") as HTMLInputElement).value = "");
      (document.getElementById("conn-right") as HTMLInputElement | null)?.value && ((document.getElementById("conn-right") as HTMLInputElement).value = "");
      qc.invalidateQueries({ queryKey: ["conn-pairs", selected] });
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  const removePair = async (p: Pair) => {
    await supabase.storage.from("videos").remove([p.left_image_path, p.right_image_path]);
    await (supabase.from("connect_pairs" as never) as any).delete().eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["conn-pairs", selected] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🔗 Connect the Pairs</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Upload matching pairs (e.g. carrot ↔ rabbit). Students draw a line from left to right to connect the pair.
      </p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="bg-card border rounded-2xl p-4">
          <h2 className="font-bold mb-2">Sets</h2>
          <div className="flex gap-2 mb-3">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Who eats what?"
              className="flex-1 px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none" />
            <button onClick={addSet} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm">Add</button>
          </div>
          <ul className="space-y-2">
            {sets.map((c) => (
              <li key={c.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${selected === c.id ? "bg-primary/10" : "bg-muted/40"}`}>
                <button className="flex-1 text-left font-semibold" onClick={() => setSelected(c.id)}>{c.title}</button>
                <button className="text-xs text-destructive" onClick={() => removeSet(c.id)}>×</button>
              </li>
            ))}
            {sets.length === 0 && <p className="text-sm text-muted-foreground">No sets yet.</p>}
          </ul>
        </div>

        <div className="bg-card border rounded-2xl p-4 min-h-[300px]">
          {!selected ? (
            <p className="text-sm text-muted-foreground text-center py-10">Pick or create a set.</p>
          ) : (
            <>
              <h2 className="font-bold mb-3">Pairs ({pairs.length})</h2>
              <ul className="space-y-2 mb-4">
                {pairs.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 bg-background rounded-xl p-2 border">
                    <img src={publicUrl(p.left_image_path)} alt="" className="size-14 rounded-lg object-cover bg-muted" />
                    <span className="text-xl">↔</span>
                    <img src={publicUrl(p.right_image_path)} alt="" className="size-14 rounded-lg object-cover bg-muted" />
                    <button onClick={() => removePair(p)} className="ml-auto text-xs text-destructive px-2">Delete</button>
                  </li>
                ))}
                {pairs.length === 0 && <p className="text-sm text-muted-foreground">No pairs yet.</p>}
              </ul>
              <form onSubmit={addPair} className="border-t pt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
                <div>
                  <label className="text-xs font-semibold block mb-1">Left image</label>
                  <input id="conn-left" required type="file" accept="image/*"
                    onChange={(e) => setLeftFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Right image</label>
                  <input id="conn-right" required type="file" accept="image/*"
                    onChange={(e) => setRightFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
                </div>
                <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
                  {busy ? "Uploading…" : "Add pair"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
