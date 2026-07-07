import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { supabase } from "@/integrations/supabase/client";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";

interface Set { id: string; title: string; }
interface Pair { id: string; set_id: string; left_image_path: string; right_image_path: string; }
const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;
function shuffle<T>(arr: T[]): T[] { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

export default function ConnectGame() {
  const { data: sets = [] } = useQuery({
    queryKey: ["conn-play-sets"],
    queryFn: async (): Promise<Set[]> => {
      const { data, error } = await (supabase.from("connect_sets" as never) as any).select("id,title").order("created_at");
      if (error) throw error; return data;
    },
  });
  const [setId, setSetId] = useState<string | null>(null);
  useEffect(() => { if (!setId && sets[0]) setSetId(sets[0].id); }, [sets, setId]);

  const { data: pairs = [] } = useQuery({
    queryKey: ["conn-play-pairs", setId],
    enabled: !!setId,
    queryFn: async (): Promise<Pair[]> => {
      const { data, error } = await (supabase.from("connect_pairs" as never) as any)
        .select("id,set_id,left_image_path,right_image_path").eq("set_id", setId);
      if (error) throw error; return data;
    },
  });

  const leftOrder = useMemo(() => shuffle(pairs), [pairs]);
  const rightOrder = useMemo(() => shuffle(pairs), [pairs]);

  const [connections, setConnections] = useState<{ leftId: string; rightId: string; correct: boolean }[]>([]);
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => { setConnections([]); setSelLeft(null); setDone(false); }, [pairs]);

  const containerRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [, forceRerender] = useState(0);
  useEffect(() => {
    const onResize = () => forceRerender((n) => n + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pickRight = (rightId: string) => {
    if (!selLeft || done) return;
    if (connections.some((c) => c.leftId === selLeft || c.rightId === rightId)) { setSelLeft(null); return; }
    const isCorrect = selLeft === rightId; // pair.id used on both sides — correct when same
    const newConns = [...connections, { leftId: selLeft, rightId, correct: isCorrect }];
    setConnections(newConns);
    setSelLeft(null);
    if (newConns.length === pairs.length) {
      const correctCount = newConns.filter((c) => c.correct).length;
      if (correctCount > 0) { addScore(correctCount); void awardGameScore("connect" as any, correctCount); }
      setDone(true);
    }
  };

  const reset = () => { setConnections([]); setSelLeft(null); setDone(false); };

  const linePos = (id: string, side: "L" | "R") => {
    const el = dotRefs.current[`${side}-${id}`]; const container = containerRef.current;
    if (!el || !container) return null;
    const r = el.getBoundingClientRect(); const c = container.getBoundingClientRect();
    return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Connect the Pairs 🔗</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {sets.map((c) => (
            <button key={c.id} onClick={() => setSetId(c.id)}
              className={`px-3 py-1.5 rounded-full border-2 text-sm font-bold ${setId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card"}`}>
              {c.title}
            </button>
          ))}
        </div>

        {pairs.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No pairs yet. Ask your teacher to add pairs in Teacher → Connect.</p>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-muted-foreground mb-3">
              Tap a picture on the left, then its match on the right.
            </p>
            <div ref={containerRef} className="relative bg-[oklch(0.98_0.02_120)] border-2 rounded-2xl p-4 grid grid-cols-[1fr_60px_1fr] gap-4 items-stretch">
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map((c, i) => {
                  const a = linePos(c.leftId, "L"); const b = linePos(c.rightId, "R");
                  if (!a || !b) return null;
                  const stroke = !done ? "var(--primary)" : c.correct ? "oklch(0.65 0.2 145)" : "oklch(0.6 0.22 25)";
                  return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth="4" />;
                })}
              </svg>
              <div className="flex flex-col gap-3">
                {leftOrder.map((p) => {
                  const used = connections.some((c) => c.leftId === p.id);
                  const selected = selLeft === p.id;
                  return (
                    <button key={p.id} disabled={used || done} onClick={() => setSelLeft(p.id)}
                      className={`relative flex items-center gap-2 p-2 rounded-2xl border-4 bg-card ${selected ? "border-primary" : "border-transparent"} ${used ? "opacity-50" : ""}`}>
                      <img src={publicUrl(p.left_image_path)} alt="" className="size-16 object-contain rounded-lg bg-muted" />
                      <div ref={(el) => { dotRefs.current[`L-${p.id}`] = el; }}
                        className="ml-auto size-4 rounded-full bg-primary" />
                    </button>
                  );
                })}
              </div>
              <div />
              <div className="flex flex-col gap-3">
                {rightOrder.map((p) => {
                  const used = connections.some((c) => c.rightId === p.id);
                  return (
                    <button key={p.id} disabled={used || done} onClick={() => pickRight(p.id)}
                      className={`relative flex items-center gap-2 p-2 rounded-2xl border-4 bg-card border-transparent ${used ? "opacity-50" : ""}`}>
                      <div ref={(el) => { dotRefs.current[`R-${p.id}`] = el; }}
                        className="mr-auto size-4 rounded-full bg-primary" />
                      <img src={publicUrl(p.right_image_path)} alt="" className="size-16 object-contain rounded-lg bg-muted" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3 flex gap-2 justify-center">
              <button onClick={reset} className="px-4 py-2 rounded-full bg-muted font-bold">Reset</button>
            </div>
            {done && (
              <p className={`mt-3 text-center font-bold text-lg`}>
                {connections.every((c) => c.correct) ? "🎉 Perfect match!" : `You got ${connections.filter((c) => c.correct).length}/${pairs.length} correct.`}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
