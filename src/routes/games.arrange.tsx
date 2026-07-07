import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { supabase } from "@/integrations/supabase/client";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";

interface Chain { id: string; title: string; }
interface Item { id: string; image_path: string; label: string; position: number; }
const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;
function shuffle<T>(arr: T[]): T[] { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

export default function ArrangeGame() {
  const { data: chains = [] } = useQuery({
    queryKey: ["arr-play-chains"],
    queryFn: async (): Promise<Chain[]> => {
      const { data, error } = await (supabase.from("arrange_chains" as never) as any).select("id,title").order("created_at");
      if (error) throw error; return data;
    },
  });
  const [chainId, setChainId] = useState<string | null>(null);
  useEffect(() => { if (!chainId && chains[0]) setChainId(chains[0].id); }, [chains, chainId]);

  const { data: items = [] } = useQuery({
    queryKey: ["arr-play-items", chainId],
    enabled: !!chainId,
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await (supabase.from("arrange_items" as never) as any)
        .select("id,image_path,label,position").eq("chain_id", chainId).order("position");
      if (error) throw error; return data;
    },
  });

  const pool = useMemo(() => shuffle(items), [items]);
  const [slots, setSlots] = useState<(Item | null)[]>([]);
  const [available, setAvailable] = useState<Item[]>([]);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    setSlots(Array(items.length).fill(null));
    setAvailable(pool);
    setResult(null);
  }, [items, pool]);

  const [dragging, setDragging] = useState<{ from: "pool" | number; item: Item } | null>(null);

  const onDropSlot = (slotIdx: number) => {
    if (!dragging) return;
    const newSlots = [...slots];
    const newAvail = [...available];
    const existing = newSlots[slotIdx];
    newSlots[slotIdx] = dragging.item;
    if (dragging.from === "pool") {
      const i = newAvail.findIndex((x) => x.id === dragging.item.id);
      if (i >= 0) newAvail.splice(i, 1);
      if (existing) newAvail.push(existing);
    } else {
      newSlots[dragging.from] = existing;
    }
    setSlots(newSlots); setAvailable(newAvail); setDragging(null); setResult(null);
  };

  const onDropPool = () => {
    if (!dragging || dragging.from === "pool") { setDragging(null); return; }
    const newSlots = [...slots];
    newSlots[dragging.from] = null;
    setSlots(newSlots);
    setAvailable([...available, dragging.item]);
    setDragging(null); setResult(null);
  };

  const check = () => {
    const ordered = [...items].sort((a, b) => a.position - b.position);
    const ok = slots.length === ordered.length && slots.every((s, i) => s && s.id === ordered[i].id);
    setResult(ok ? "correct" : "wrong");
    if (ok) { addScore(ordered.length); void awardGameScore("arrange" as any, ordered.length); }
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Arrange the Order 🔢</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {chains.map((c) => (
            <button key={c.id} onClick={() => setChainId(c.id)}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${chainId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>
              {c.title}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No chains yet. Ask your teacher to add pictures in Teacher → Arrange.</p>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground mb-3">
              Drag each picture into the correct slot (first → last).
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropPool}
              className="bg-[oklch(0.98_0.02_120)] border-2 rounded-2xl p-4 min-h-[180px] mb-4 flex flex-wrap gap-3 justify-center"
            >
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground self-center">All placed — press Check ↓</p>
              ) : available.map((it) => (
                <div key={it.id} draggable
                  onDragStart={() => setDragging({ from: "pool", item: it })}
                  className="cursor-grab active:cursor-grabbing flex flex-col items-center">
                  <img src={publicUrl(it.image_path)} alt={it.label} className="size-24 object-contain rounded-xl bg-card border-2 shadow" />
                  {it.label && <span className="mt-1 text-xs font-bold">{it.label}</span>}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {slots.map((slot, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDropSlot(i)}
                    className={`size-28 rounded-2xl border-4 border-dashed grid place-items-center ${slot ? "border-primary bg-card" : "border-muted-foreground/30 bg-muted/30"}`}
                  >
                    {slot ? (
                      <img draggable onDragStart={() => setDragging({ from: i, item: slot })}
                        src={publicUrl(slot.image_path)} alt={slot.label}
                        className="w-full h-full object-contain rounded-xl cursor-grab" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  {i < slots.length - 1 && <span className="text-2xl -mt-1">→</span>}
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-center">
              <button onClick={() => { setSlots(Array(items.length).fill(null)); setAvailable(pool); setResult(null); }}
                className="px-4 py-2 rounded-full bg-muted font-bold">Reset</button>
              <button onClick={check} disabled={slots.some((s) => !s)}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-50">Check</button>
            </div>
            {result && (
              <p className={`mt-3 text-center font-bold ${result === "correct" ? "text-primary" : "text-destructive"}`}>
                {result === "correct" ? "🎉 Correct! Great order." : "❌ Not quite — try again."}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
