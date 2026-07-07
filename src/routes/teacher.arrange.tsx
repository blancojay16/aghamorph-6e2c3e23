import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Chain { id: string; title: string; }
interface Item { id: string; chain_id: string; image_path: string; label: string; position: number; }

const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;

export default function TeacherArrange() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: chains = [] } = useQuery({
    queryKey: ["arr-chains"],
    queryFn: async (): Promise<Chain[]> => {
      const { data, error } = await (supabase.from("arrange_chains" as never) as any)
        .select("id,title").order("created_at");
      if (error) throw error; return data;
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["arr-items", selected],
    enabled: !!selected,
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await (supabase.from("arrange_items" as never) as any)
        .select("id,chain_id,image_path,label,position").eq("chain_id", selected).order("position");
      if (error) throw error; return data;
    },
  });

  const addChain = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await (supabase.from("arrange_chains" as never) as any)
      .insert({ title: newTitle.trim() }).select().single();
    if (error) return toast.error(error.message);
    setNewTitle(""); setSelected(data.id);
    qc.invalidateQueries({ queryKey: ["arr-chains"] });
  };

  const removeChain = async (id: string) => {
    if (!confirm("Delete this chain?")) return;
    await (supabase.from("arrange_chains" as never) as any).delete().eq("id", id);
    if (selected === id) setSelected(null);
    qc.invalidateQueries({ queryKey: ["arr-chains"] });
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selected) return;
    setBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `arrange/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("videos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const pos = (items[items.length - 1]?.position ?? 0) + 1;
      const { error } = await (supabase.from("arrange_items" as never) as any)
        .insert({ chain_id: selected, image_path: path, label: label.trim(), position: pos });
      if (error) throw error;
      setLabel(""); setFile(null);
      const el = document.getElementById("arr-file") as HTMLInputElement | null;
      if (el) el.value = "";
      qc.invalidateQueries({ queryKey: ["arr-items", selected] });
    } catch (err) { toast.error((err as Error).message); }
    finally { setBusy(false); }
  };

  const removeItem = async (it: Item) => {
    await supabase.storage.from("videos").remove([it.image_path]);
    await (supabase.from("arrange_items" as never) as any).delete().eq("id", it.id);
    qc.invalidateQueries({ queryKey: ["arr-items", selected] });
  };

  const swap = async (a: number, b: number) => {
    if (a < 0 || b < 0 || a >= items.length || b >= items.length) return;
    const A = items[a], B = items[b];
    await (supabase.from("arrange_items" as never) as any).update({ position: B.position }).eq("id", A.id);
    await (supabase.from("arrange_items" as never) as any).update({ position: A.position }).eq("id", B.id);
    qc.invalidateQueries({ queryKey: ["arr-items", selected] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">🔢 Arrange the Order</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Create a food chain, then upload each picture <b>in the correct order</b> (Sun → Plant → Herbivore → …).
        Students will drag the scattered pictures into the right slots.
      </p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="bg-card border rounded-2xl p-4">
          <h2 className="font-bold mb-2">Chains</h2>
          <div className="flex gap-2 mb-3">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Rice field"
              className="flex-1 px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none" />
            <button onClick={addChain} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm">Add</button>
          </div>
          <ul className="space-y-2">
            {chains.map((c) => (
              <li key={c.id}
                className={`flex items-center gap-2 p-2 rounded-lg ${selected === c.id ? "bg-primary/10" : "bg-muted/40"}`}>
                <button className="flex-1 text-left font-semibold" onClick={() => setSelected(c.id)}>{c.title}</button>
                <button className="text-xs text-destructive" onClick={() => removeChain(c.id)}>×</button>
              </li>
            ))}
            {chains.length === 0 && <p className="text-sm text-muted-foreground">No chains yet.</p>}
          </ul>
        </div>

        <div className="bg-card border rounded-2xl p-4 min-h-[300px]">
          {!selected ? (
            <p className="text-sm text-muted-foreground text-center py-10">Pick or create a chain.</p>
          ) : (
            <>
              <h2 className="font-bold mb-3">In order ({items.length})</h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-4">Add pictures below.</p>
              ) : (
                <ol className="space-y-2 mb-4">
                  {items.map((o, i) => (
                    <li key={o.id} className="flex items-center gap-3 bg-background rounded-xl p-2 border">
                      <span className="size-7 grid place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{i + 1}</span>
                      <img src={publicUrl(o.image_path)} alt="" className="size-14 rounded-lg object-cover bg-muted" />
                      <span className="flex-1 font-semibold truncate">{o.label || "(no label)"}</span>
                      <button disabled={i === 0} onClick={() => swap(i, i - 1)} className="px-2 py-1 rounded bg-muted disabled:opacity-30">↑</button>
                      <button disabled={i === items.length - 1} onClick={() => swap(i, i + 1)} className="px-2 py-1 rounded bg-muted disabled:opacity-30">↓</button>
                      <button onClick={() => removeItem(o)} className="text-xs text-destructive px-2">×</button>
                    </li>
                  ))}
                </ol>
              )}
              <form onSubmit={addItem} className="border-t pt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
                <div>
                  <label className="text-xs font-semibold block mb-1">Label (optional)</label>
                  <input placeholder="e.g. Grasshopper" value={label} onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Image</label>
                  <input id="arr-file" required type="file" accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
                </div>
                <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
                  {busy ? "Uploading…" : "Add picture"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
