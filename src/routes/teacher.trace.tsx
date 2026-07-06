import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Chain { id: string; title: string; }
interface Organism { id: string; chain_id: string; label: string; file_path: string; position: number; }

function TraceAdmin() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: chains = [] } = useQuery({
    queryKey: ["admin-chains"],
    queryFn: async (): Promise<Chain[]> => {
      const { data, error } = await (supabase.from("trace_chains" as never) as any)
        .select("id,title").order("created_at", { ascending: true });
      if (error) throw error; return data as Chain[];
    },
  });

  const { data: organisms = [] } = useQuery({
    queryKey: ["admin-orgs", selectedChain],
    enabled: !!selectedChain,
    queryFn: async (): Promise<(Organism & { url: string })[]> => {
      const { data, error } = await (supabase.from("trace_organisms" as never) as any)
        .select("id,chain_id,label,file_path,position").eq("chain_id", selectedChain).order("position");
      if (error) throw error;
      return (data as any[]).map((o) => ({
        ...o, url: supabase.storage.from("videos").getPublicUrl(o.file_path).data.publicUrl,
      }));
    },
  });

  const addChain = async () => {
    if (!newTitle.trim()) return;
    const { data, error } = await (supabase.from("trace_chains" as never) as any)
      .insert({ title: newTitle.trim(), system: "food_chain" }).select().single();
    if (error) return toast.error(error.message);
    setNewTitle(""); setSelectedChain((data as any).id);
    qc.invalidateQueries({ queryKey: ["admin-chains"] });
    toast.success("Chain created");
  };

  const removeChain = async (id: string) => {
    if (!confirm("Delete this chain and all its organisms?")) return;
    await (supabase.from("trace_chains" as never) as any).delete().eq("id", id);
    if (selectedChain === id) setSelectedChain(null);
    qc.invalidateQueries({ queryKey: ["admin-chains"] });
  };

  const addOrganism = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedChain || !label.trim()) return;
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `trace/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from("videos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const nextPos = (organisms[organisms.length - 1]?.position ?? 0) + 1;
      const { error } = await (supabase.from("trace_organisms" as never) as any).insert({
        chain_id: selectedChain, label: label.trim(), file_path: path, position: nextPos,
      });
      if (error) throw error;
      setLabel(""); setFile(null);
      const inputEl = document.getElementById("org-file") as HTMLInputElement | null;
      if (inputEl) inputEl.value = "";
      qc.invalidateQueries({ queryKey: ["admin-orgs", selectedChain] });
      toast.success("Added");
    } catch (err) { toast.error((err as Error).message); }
    finally { setUploading(false); }
  };

  const removeOrg = async (id: string, path: string) => {
    await supabase.storage.from("videos").remove([path]);
    await (supabase.from("trace_organisms" as never) as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-orgs", selectedChain] });
  };

  const swap = async (aIdx: number, bIdx: number) => {
    if (aIdx < 0 || bIdx < 0 || aIdx >= organisms.length || bIdx >= organisms.length) return;
    const a = organisms[aIdx], b = organisms[bIdx];
    await (supabase.from("trace_organisms" as never) as any).update({ position: b.position }).eq("id", a.id);
    await (supabase.from("trace_organisms" as never) as any).update({ position: a.position }).eq("id", b.id);
    qc.invalidateQueries({ queryKey: ["admin-orgs", selectedChain] });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">➡️ Trace game — food chains</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Create a chain, then upload one image per organism <b>in the order they eat each other</b>
        (first = plant/producer). Use the arrows to reorder.
      </p>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <div className="bg-card border rounded-2xl p-4 mb-4">
            <h2 className="font-bold mb-2">Chains</h2>
            <div className="flex gap-2 mb-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Rice field"
                className="flex-1 px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none" />
              <button onClick={addChain}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-bold text-sm">Add</button>
            </div>
            <ul className="space-y-2">
              {chains.map((c) => (
                <li key={c.id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${selectedChain === c.id ? "bg-primary/10" : "bg-muted/40"}`}>
                  <button className="flex-1 text-left font-semibold" onClick={() => setSelectedChain(c.id)}>{c.title}</button>
                  <button className="text-xs text-destructive" onClick={() => removeChain(c.id)}>Delete</button>
                </li>
              ))}
              {chains.length === 0 && <p className="text-sm text-muted-foreground">No chains yet.</p>}
            </ul>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 min-h-[300px]">
          {!selectedChain ? (
            <p className="text-sm text-muted-foreground text-center py-10">Pick or create a chain.</p>
          ) : (
            <>
              <h2 className="font-bold mb-3">Organisms in order ({organisms.length})</h2>
              {organisms.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-4">Add your first organism below.</p>
              ) : (
                <ol className="space-y-2 mb-4">
                  {organisms.map((o, i) => (
                    <li key={o.id} className="flex items-center gap-3 bg-background rounded-xl p-2 border">
                      <span className="size-7 grid place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{i + 1}</span>
                      <img src={o.url} alt={o.label} className="size-14 rounded-lg object-cover bg-muted" />
                      <span className="flex-1 font-semibold truncate">{o.label}</span>
                      <button disabled={i === 0} onClick={() => swap(i, i - 1)}
                        className="px-2 py-1 rounded bg-muted disabled:opacity-30" aria-label="Move up">↑</button>
                      <button disabled={i === organisms.length - 1} onClick={() => swap(i, i + 1)}
                        className="px-2 py-1 rounded bg-muted disabled:opacity-30" aria-label="Move down">↓</button>
                      <button onClick={() => removeOrg(o.id, o.file_path)}
                        className="text-xs text-destructive px-2">Delete</button>
                    </li>
                  ))}
                </ol>
              )}

              <form onSubmit={addOrganism} className="border-t pt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-end">
                <div>
                  <label className="text-xs font-semibold block mb-1">Label</label>
                  <input required placeholder="e.g. Grasshopper" value={label} onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1">Image</label>
                  <input id="org-file" required type="file" accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm" />
                </div>
                <button disabled={uploading} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-60">
                  {uploading ? "Uploading…" : "Add organism"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TraceAdmin;
