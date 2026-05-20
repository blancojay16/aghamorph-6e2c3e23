import { Link, useRouterState } from "@tanstack/react-router";
import { loadProgress } from "@/lib/progress";
import { useEffect, useState } from "react";

export function StudentHeader() {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const update = () => setScore(loadProgress().score);
    update();
    window.addEventListener("aghamorph:progress", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("aghamorph:progress", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
        <Link to="/student" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">🧬</span>
          <span className="bg-gradient-to-r from-primary to-[oklch(0.7_0.18_220)] bg-clip-text text-transparent">
            Aghamorph
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            to="/student"
            className={`px-3 py-2 rounded-full ${path === "/student" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Learn
          </Link>
          <Link
            to="/games"
            className={`px-3 py-2 rounded-full ${path.startsWith("/games") || path === "/matching" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Games
          </Link>
          <Link
            to="/scan"
            className={`px-3 py-2 rounded-full ${path === "/scan" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            Scan
          </Link>
          <div className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-full bg-accent text-accent-foreground font-bold">
            <span>⭐</span>
            <span>{score}</span>
          </div>
          <Link
            to="/"
            className="ml-1 px-3 py-2 rounded-full text-xs text-muted-foreground hover:bg-muted"
          >
            Switch role
          </Link>
        </nav>
      </div>
    </header>
  );
}
