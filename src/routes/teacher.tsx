import { Link, useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getCacheStatus,
  syncCacheOnce,
} from "@/lib/offline-cache";

function TeacherLayout({ children }: { children: React.ReactNode }) {
  const history = useHistory();
  const [status, setStatus] = useState(getCacheStatus());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatus(getCacheStatus());
    const on = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setStatus(detail);
      else setStatus(getCacheStatus());
    };
    const online = () => {
      setStatus({ ...getCacheStatus(), online: true });
      void syncCacheOnce();
    };
    const offline = () => setStatus({ ...getCacheStatus(), online: false });
    window.addEventListener("aghamorph:cache-status", on);
    window.addEventListener("aghamorph:cache", on);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("aghamorph:cache-status", on);
      window.removeEventListener("aghamorph:cache", on);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const badgeText = !mounted
    ? "● …"
    : !status.online
      ? "● Offline"
      : status.caching > 0
        ? `⟳ Caching (${status.caching})`
        : "● Online";

  const badgeClass = !mounted
    ? "bg-muted text-muted-foreground"
    : !status.online
      ? "bg-destructive/15 text-destructive"
      : status.caching > 0
        ? "bg-accent text-accent-foreground"
        : "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-2 sm:gap-4 flex-wrap">
          <Link to="/teacher" className="font-bold text-lg flex items-center gap-2">
            <span>🧬</span> Aghamorph <span className="text-muted-foreground font-normal">/ Teacher</span>
          </Link>
          <span
            className={`ml-2 text-xs px-2 py-1 rounded-full font-semibold ${badgeClass}`}
            title={!status.online ? "Offline — videos already downloaded still work" : "Online"}
          >
            {badgeText}
          </span>
          <Link to="/teacher/students" className="ml-auto text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            👥 Groups
          </Link>
          <Link to="/teacher/rankings" className="text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            🏆 Rankings
          </Link>
          <Link to="/teacher/games" className="text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            🧩 Game images
          </Link>
          <Link to="/teacher/trace" className="text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            ➡️ Trace game
          </Link>
          <Link to="/" className="text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            Student view
          </Link>
          <button
            onClick={() => history.push("/")}
            className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-secondary"
          >
            Leave
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export default TeacherLayout;
