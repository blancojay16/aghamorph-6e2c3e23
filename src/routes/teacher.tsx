import { Link, useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import { listLocalVideos, startSyncLoop } from "@/lib/offline-sync";

function TeacherLayout() {
  const history = useHistory();
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const stop = startSyncLoop();
    const refresh = async () => {
      try {
        const list = await listLocalVideos();
        setPending(list.filter((v) => v.syncStatus !== "synced").length);
      } catch {
        /* IDB unavailable */
      }
    };
    refresh();
    const onSync = () => refresh();
    const onLine = () => setOnline(true);
    const offLine = () => setOnline(false);
    window.addEventListener("aghamorph:sync", onSync);
    window.addEventListener("online", onLine);
    window.addEventListener("offline", offLine);
    return () => {
      stop?.();
      window.removeEventListener("aghamorph:sync", onSync);
      window.removeEventListener("online", onLine);
      window.removeEventListener("offline", offLine);
    };
  }, []);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-2 sm:gap-4 flex-wrap">
          <Link to="/teacher" className="font-bold text-lg flex items-center gap-2">
            <span>🧬</span> Aghamorph <span className="text-muted-foreground font-normal">/ Teacher</span>
          </Link>
          <span
            className={`ml-2 text-xs px-2 py-1 rounded-full font-semibold ${
              !online
                ? "bg-destructive/15 text-destructive"
                : pending > 0
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
            title={
              !online
                ? "Offline — changes save locally"
                : pending > 0
                  ? `${pending} item${pending === 1 ? "" : "s"} waiting to upload`
                  : "All changes synced"
            }
          >
            {!online ? "● Offline" : pending > 0 ? `⟳ Syncing (${pending})` : "● Synced"}
          </span>
          <Link
            to="/teacher/students"
            className="ml-auto text-sm px-3 py-1.5 rounded-full hover:bg-muted"
          >
            👥 Groups
          </Link>
          <Link
            to="/teacher/rankings"
            className="text-sm px-3 py-1.5 rounded-full hover:bg-muted"
          >
            🏆 Rankings
          </Link>
          <Link to="/teacher/games" className="text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            🧩 Game images
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
      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}


export default TeacherLayout;
