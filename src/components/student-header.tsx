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
      <div className="mx-auto max-w-5xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        <Link to="/student" className="flex items-center gap-1.5 font-bold text-base sm:text-xl shrink-0">
          <span className="text-xl sm:text-2xl">🧬</span>
          <span className="bg-gradient-to-r from-primary to-[oklch(0.7_0.18_220)] bg-clip-text text-transparent">
            Aghamorph
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-accent text-accent-foreground font-bold text-sm shrink-0">
          <span>⭐</span>
          <span>{score}</span>
        </div>

        <Link
          to="/"
          className="hidden sm:inline-block px-3 py-2 rounded-full text-xs text-muted-foreground hover:bg-muted shrink-0"
        >
          Switch role
        </Link>
      </div>

      <nav className="mx-auto max-w-5xl px-3 sm:px-4 pb-2 sm:pb-3 flex items-center gap-1 text-sm overflow-x-auto">
        <Link
          to="/student"
          className={`px-3 py-1.5 rounded-full whitespace-nowrap ${path === "/student" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          Learn
        </Link>
        <Link
          to="/games"
          className={`px-3 py-1.5 rounded-full whitespace-nowrap ${path.startsWith("/games") || path === "/matching" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          Games
        </Link>
        <Link
          to="/scan"
          className={`px-3 py-1.5 rounded-full whitespace-nowrap ${path === "/scan" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
        >
          Scan
        </Link>
        <Link
          to="/"
          className="sm:hidden ml-auto px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:bg-muted whitespace-nowrap"
        >
          Switch
        </Link>
      </nav>
    </header>
  );
}
