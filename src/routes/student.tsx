import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEMS, systemMeta, type BodySystem } from "@/lib/systems";
import { StudentHeader } from "@/components/student-header";
import { loadProgress } from "@/lib/progress";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student — Aghamorph" },
      { name: "description", content: "Watch lessons and earn badges." },
    ],
  }),
  component: StudentHome,
});

function StudentHome() {
  const { data: videos = [] } = useQuery({
    queryKey: ["videos-by-system"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id,title,system")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [badges, setBadges] = useState(loadProgress().badges);
  useEffect(() => {
    const u = () => setBadges(loadProgress().badges);
    window.addEventListener("aghamorph:progress", u);
    return () => window.removeEventListener("aghamorph:progress", u);
  }, []);

  const grouped = videos.reduce<Record<BodySystem, typeof videos>>(
    (acc, v) => {
      (acc[v.system as BodySystem] ||= []).push(v);
      return acc;
    },
    {} as never,
  );

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
            Explore your <span className="text-primary">amazing body</span>!
          </h1>
          <p className="text-lg text-muted-foreground">
            Tap a system to watch, learn, and earn badges 🏅
          </p>
          <div className="mt-4">
            <Link
              to="/scan"
              className="inline-block px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold hover:scale-105 transition"
            >
              📷 Scan a lesson QR code
            </Link>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          {SYSTEMS.map((s) => {
            const list = grouped[s.key] ?? [];
            const earned = badges[s.key];
            return (
              <div
                key={s.key}
                className="rounded-3xl p-5 border-2 bg-card shadow-sm hover:shadow-md transition"
                style={{ borderColor: s.colorVar }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="size-14 rounded-2xl grid place-items-center text-3xl"
                    style={{ background: `color-mix(in oklab, ${s.colorVar} 18%, transparent)` }}
                  >
                    {s.emoji}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {s.label}
                      {earned && <span title="Badge earned">🏅</span>}
                    </h2>
                    <p className="text-sm text-muted-foreground">{s.tagline}</p>
                  </div>
                </div>

                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic px-1">
                    No videos yet — your teacher will add some soon.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((v) => (
                      <li key={v.id}>
                        <Link
                          to="/play/$videoId"
                          params={{ videoId: v.id }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-secondary transition group"
                        >
                          <span className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center">
                            ▶
                          </span>
                          <span className="font-semibold flex-1">{v.title}</span>
                          <span className="text-muted-foreground group-hover:translate-x-1 transition">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-3xl p-6 bg-gradient-to-br from-accent to-[oklch(0.85_0.18_60)] text-accent-foreground text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to play?</h3>
          <p className="mb-4">Jigsaw, memory, quiz rush and more await!</p>
          <Link
            to="/games"
            className="inline-block bg-foreground text-background px-6 py-3 rounded-full font-bold hover:scale-105 transition"
          >
            Open games 🎮
          </Link>
        </div>
      </main>
    </div>
  );
}

void systemMeta;
