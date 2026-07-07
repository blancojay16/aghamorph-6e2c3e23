import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Animal { id: string; label: string; image_path: string; category: "herbivore" | "carnivore" | "omnivore"; }
const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;

export default function TeacherTraceAnimal() {
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState<Animal["category"]>("herbivore");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: animals = [] } = useQuery({
    queryKey: ["trace-animals"],
    queryFn: async (): Promise<Animal[]> => {
      const { data, error } = await (supabase.from("trace_animals" as never) as any)
        .select("id,label,image_path,category").order("created_at");
      if (error) throw error; return data;
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label.trim()) return;
    setBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `trace-animals/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("videos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await (supabase.from("trace_animals" as never) as any)
        .insert({ label: label.trim(), image_path: path, category });
      if (error) throw error;
      setLabel(""); setFile(null);
      const el = document.getElementById("ta-file") as HTMLInputElement | null;
      if (el) el.value = "";
      qc.invalidateQueries({ queryKey: ["trace-animals"] });
      toast.success("Animal added");
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  const remove = async (a: Animal) => {
    await supabase.storage.from("videos").remove([a.image_path]);
    await (supabase.from("trace_animals" as never) as any).delete().eq("id", a.id);
    qc.invalidateQueries({ queryKey: ["trace-animals"] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">✏️ Trace the Animal</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Upload a dotted/outline drawing. Pick its category — students trace it, then guess whether it eats plants, meat, or both.
      </p>

      <form onSubmit={submit} className="bg-card border rounded-2xl p-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end mb-6">
        <div>
          <label className="text-xs font-semibold block mb-1">Animal name</label>
          <input required value={label} onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none" placeholder="e.g. Lion" />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Animal["category"])}
            className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none">
            <option value="herbivore">🌿 Herbivore</option>
            <option value="carnivore">🍖 Carnivore</option>
            <option value="omnivore">🥩 Omnivore</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1">Outline image</label>
          <input id="ta-file" required type="file" accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
        </div>
        <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
          {busy ? "Uploading…" : "Add animal"}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {animals.map((a) => (
          <div key={a.id} className="bg-card border rounded-2xl p-3 flex items-center gap-3">
            <img src={publicUrl(a.image_path)} alt={a.label} className="size-20 rounded-lg object-contain bg-muted" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{a.label}</p>
              <p className="text-xs text-muted-foreground capitalize">{a.category}</p>
            </div>
            <button onClick={() => remove(a)} className="text-xs text-destructive px-2">Delete</button>
          </div>
        ))}
        {animals.length === 0 && <p className="text-sm text-muted-foreground">No animals yet.</p>}
      </div>
    </div>
  );
}
