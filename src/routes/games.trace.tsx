import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { supabase } from "@/integrations/supabase/client";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";

interface Chain { id: string; title: string; }
interface Organism {
  id: string; chain_id: string; label: string; file_path: string; position: number; url: string;
}

function seed(n: number, s: number) { const x = Math.sin(s + n) * 10000; return x - Math.floor(x); }

function scatterPositions(count: number, seedId: string, w: number, h: number, pad = 60) {
  const s = seedId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pts: { x: number; y: number }[] = [];
  let attempts = 0;
  while (pts.length < count && attempts < 1000) {
    attempts++;
    const x = pad + seed(pts.length * 3 + attempts, s) * (w - pad * 2);
    const y = pad + seed(pts.length * 7 + attempts * 2, s) * (h - pad * 2);
    if (pts.every((p) => Math.hypot(p.x - x, p.y - y) > 130)) pts.push({ x, y });
  }
  while (pts.length < count) pts.push({ x: w / 2, y: h / 2 });
  return pts;
}

function TraceGame() {
  const { data: chains = [] } = useQuery({
    queryKey: ["trace-chains"],
    queryFn: async (): Promise<Chain[]> => {
      const { data, error } = await (supabase.from("trace_chains" as never) as any)
        .select("id,title").order("created_at", { ascending: true });
      if (error) throw error; return data as Chain[];
    },
  });
  const [chainId, setChainId] = useState<string | null>(null);
  useEffect(() => { if (!chainId && chains[0]) setChainId(chains[0].id); }, [chains, chainId]);

  const { data: organisms = [] } = useQuery({
    queryKey: ["trace-orgs", chainId],
    enabled: !!chainId,
    queryFn: async (): Promise<Organism[]> => {
      const { data, error } = await (supabase.from("trace_organisms" as never) as any)
        .select("id,chain_id,label,file_path,position").eq("chain_id", chainId).order("position");
      if (error) throw error;
      return (data as any[]).map((o) => ({
        ...o, url: supabase.storage.from("videos").getPublicUrl(o.file_path).data.publicUrl,
      }));
    },
  });

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const scattered = useMemo(() => {
    const pts = scatterPositions(organisms.length, chainId || "x", size.w, size.h);
    return organisms.map((o, i) => ({ ...o, x: pts[i].x, y: pts[i].y }));
  }, [organisms, chainId, size.w, size.h]);

  const [arrows, setArrows] = useState<[string, string][]>([]);
  const [dragFrom, setDragFrom] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => { setArrows([]); setResult(null); }, [chainId]);

  const startFrom = (id: string, e: React.PointerEvent) => {
    e.preventDefault(); setDragFrom(id);
    const rect = wrapRef.current!.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const move = (e: React.PointerEvent) => {
    if (!dragFrom) return;
    const rect = wrapRef.current!.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const end = (e: React.PointerEvent) => {
    if (!dragFrom) return;
    const rect = wrapRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const target = scattered.find((o) => Math.hypot(o.x - px, o.y - py) < 55 && o.id !== dragFrom);
    if (target) setArrows((a) => [...a, [dragFrom, target.id]]);
    setDragFrom(null); setPointer(null);
  };

  const check = () => {
    const ordered = [...organisms].sort((a, b) => a.position - b.position);
    const expected: [string, string][] = [];
    for (let i = 0; i < ordered.length - 1; i++) expected.push([ordered[i].id, ordered[i + 1].id]);
    const ok = arrows.length === expected.length &&
      expected.every(([a, b], i) => arrows[i][0] === a && arrows[i][1] === b);
    setResult(ok ? "correct" : "wrong");
    if (ok) { addScore(expected.length); void awardGameScore("trace" as any, expected.length); }
  };

  const idToPt = new Map(scattered.map((o) => [o.id, { x: o.x, y: o.y }]));

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Trace the Food Chain ➡️</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {chains.map((c) => (
            <button key={c.id} onClick={() => setChainId(c.id)}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${
                chainId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card"
              }`}>{c.title}</button>
          ))}
        </div>

        {organisms.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">
              No trace chains yet. Ask your teacher to upload organisms in Teacher → Trace game.
            </p>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground mb-3">
              Drag from one organism to the next to draw an arrow. Trace the food chain in order (eater points to prey).
            </p>
            <div
              ref={wrapRef}
              onPointerMove={move}
              onPointerUp={end}
              className="relative bg-[oklch(0.98_0.02_120)] border-2 rounded-2xl overflow-hidden touch-none select-none"
              style={{ height: 520 }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="var(--primary)" />
                  </marker>
                </defs>
                {arrows.map(([a, b], i) => {
                  const p1 = idToPt.get(a), p2 = idToPt.get(b);
                  if (!p1 || !p2) return null;
                  return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke="var(--primary)" strokeWidth="4" markerEnd="url(#arrow)" />;
                })}
                {dragFrom && pointer && idToPt.get(dragFrom) && (
                  <line
                    x1={idToPt.get(dragFrom)!.x} y1={idToPt.get(dragFrom)!.y}
                    x2={pointer.x} y2={pointer.y}
                    stroke="var(--primary)" strokeWidth="3" strokeDasharray="6 6"
                  />
                )}
              </svg>

              {scattered.map((o) => (
                <div key={o.id}
                  onPointerDown={(e) => startFrom(o.id, e)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing"
                  style={{ left: o.x, top: o.y }}
                >
                  <div className="size-24 rounded-full overflow-hidden bg-card border-4 border-primary shadow">
                    <img src={o.url} alt={o.label} className="w-full h-full object-cover pointer-events-none" />
                  </div>
                  <span className="mt-1 px-2 py-0.5 bg-card border rounded-full text-xs font-bold">{o.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button onClick={() => setArrows((a) => a.slice(0, -1))}
                className="px-4 py-2 rounded-full bg-muted font-bold">Undo</button>
              <button onClick={() => { setArrows([]); setResult(null); }}
                className="px-4 py-2 rounded-full bg-muted font-bold">Reset</button>
              <button onClick={check}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold">Check</button>
            </div>
            {result && (
              <p className={`mt-3 text-center font-bold ${result === "correct" ? "text-primary" : "text-destructive"}`}>
                {result === "correct" ? "🎉 Correct! Great tracing." : "❌ Not quite — try again."}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default TraceGame;
