import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StudentHeader } from "@/components/student-header";
import { supabase } from "@/integrations/supabase/client";
import { addScore } from "@/lib/progress";
import { awardGameScore } from "@/lib/game-scores";

interface Animal { id: string; label: string; image_path: string; category: "herbivore" | "carnivore" | "omnivore"; }
const publicUrl = (p: string) => supabase.storage.from("videos").getPublicUrl(p).data.publicUrl;

export default function TraceAnimalGame() {
  const { data: animals = [] } = useQuery({
    queryKey: ["trace-animals-play"],
    queryFn: async (): Promise<Animal[]> => {
      const { data, error } = await (supabase.from("trace_animals" as never) as any)
        .select("id,label,image_path,category").order("created_at");
      if (error) throw error; return data;
    },
  });
  const [idx, setIdx] = useState(0);
  const animal = animals[idx];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [showQuestion, setShowQuestion] = useState(false);
  const [answer, setAnswer] = useState<null | "correct" | "wrong">(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!; ctx.clearRect(0, 0, c.width, c.height);
    setShowQuestion(false); setAnswer(null);
  }, [idx]);

  const drawingRef = useRef(false);
  const posRef = useRef<{ x: number; y: number } | null>(null);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault(); drawingRef.current = true; posRef.current = pos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    const p = pos(e); const from = posRef.current ?? p;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (tool === "draw") { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = "oklch(0.55 0.2 260)"; ctx.lineWidth = 5; }
    else { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = 24; }
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    posRef.current = p;
  };
  const end = () => { drawingRef.current = false; posRef.current = null; };

  const clearCanvas = () => {
    const c = canvasRef.current; if (!c) return;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  const answerCategory = (cat: Animal["category"]) => {
    if (!animal) return;
    const ok = cat === animal.category;
    setAnswer(ok ? "correct" : "wrong");
    if (ok) { addScore(1); void awardGameScore("traceanimal" as any, 1); }
    setTimeout(() => {
      setShowQuestion(false); setAnswer(null);
      clearCanvas();
      setIdx((i) => (i + 1 < animals.length ? i + 1 : 0));
    }, 1400);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/games" className="size-10 grid place-items-center rounded-full bg-muted">←</Link>
          <h1 className="text-2xl font-extrabold flex-1">Trace the Animal ✏️</h1>
        </div>

        {animals.length === 0 ? (
          <div className="rounded-2xl bg-card p-10 text-center border-2 border-dashed">
            <p className="text-muted-foreground">No animals yet. Ask your teacher to add some in Teacher → Trace Animal.</p>
          </div>
        ) : animal ? (
          <>
            <p className="text-center text-sm text-muted-foreground mb-3">
              Trace over <b>{animal.label}</b>. Use eraser to fix mistakes, then press Done.
            </p>
            <div className="relative bg-white border-2 rounded-2xl overflow-hidden aspect-[3/4] max-w-lg mx-auto">
              <img src={publicUrl(animal.image_path)} alt={animal.label}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" draggable={false} />
              <canvas ref={canvasRef} width={900} height={1200}
                onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
                className="absolute inset-0 w-full h-full touch-none" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              <button onClick={() => setTool("draw")}
                className={`px-4 py-2 rounded-full font-bold ${tool === "draw" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>✏️ Draw</button>
              <button onClick={() => setTool("erase")}
                className={`px-4 py-2 rounded-full font-bold ${tool === "erase" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>🧹 Eraser</button>
              <button onClick={clearCanvas} className="px-4 py-2 rounded-full bg-muted font-bold">Clear</button>
              <button onClick={() => setShowQuestion(true)}
                className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold">Done ✓</button>
            </div>
          </>
        ) : null}

        {showQuestion && animal && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur grid place-items-center p-6">
            <div className="w-full max-w-2xl text-center">
              <p className="text-3xl md:text-4xl font-extrabold mb-2">Great tracing! 🎉</p>
              <p className="text-xl md:text-2xl mb-8">Is a <span className="text-primary">{animal.label}</span> a…</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {(["herbivore", "carnivore", "omnivore"] as const).map((cat) => {
                  const emoji = cat === "herbivore" ? "🌿" : cat === "carnivore" ? "🍖" : "🥩";
                  const isRight = answer && cat === animal.category;
                  const cls = answer && isRight ? "ring-4 ring-[oklch(0.7_0.18_145)]" : "";
                  return (
                    <button key={cat} disabled={!!answer} onClick={() => answerCategory(cat)}
                      className={`rounded-3xl p-6 bg-card border-4 text-2xl font-bold hover:scale-105 transition disabled:cursor-not-allowed ${cls}`}>
                      <div className="text-5xl mb-2">{emoji}</div>
                      <div className="capitalize">{cat}</div>
                    </button>
                  );
                })}
              </div>
              {answer && (
                <p className={`mt-6 text-2xl font-bold ${answer === "correct" ? "text-primary" : "text-destructive"}`}>
                  {answer === "correct" ? "✅ Correct!" : `❌ It's a ${animal.category}.`}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
