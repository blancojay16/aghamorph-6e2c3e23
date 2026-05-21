import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StudentHeader } from "@/components/student-header";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [{ title: "Scan QR — Aghamorph" }],
  }),
  component: ScanPage,
});

function extractVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    const m = u.pathname.match(/\/play\/([^/?#]+)/);
    if (m) return m[1];
  } catch {
    /* not a URL */
  }
  return trimmed;
}

function ScanPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const openId = (id: string) => {
    setScanning(false);
    navigate({ to: "/play/$videoId", params: { videoId: id } });
  };

  const openManual = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(value);
    if (id) openId(id);
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <Link to="/student" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-3xl font-extrabold mt-3 mb-2">Scan a lesson</h1>
        <p className="text-muted-foreground mb-6">
          Point your camera at the QR code your teacher shared. The lesson will open
          automatically.
        </p>

        <div className="rounded-2xl overflow-hidden border-2 bg-black aspect-square mb-3">
          {scanning && (
            <Scanner
              onScan={(codes) => {
                const text = codes[0]?.rawValue;
                if (!text) return;
                const id = extractVideoId(text);
                if (id) openId(id);
              }}
              onError={(err) => {
                const msg = err instanceof Error ? err.message : String(err);
                setError(msg);
              }}
              constraints={{ facingMode: "environment" }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive mb-3">
            Camera unavailable: {error}. You can paste the lesson link below instead.
          </p>
        )}

        <details className="bg-card border rounded-2xl p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            No camera? Paste the link
          </summary>
          <form onSubmit={openManual} className="mt-3 space-y-3">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://…/play/abcd-1234"
              className="w-full px-3 py-2 rounded-lg border-2 bg-background focus:border-primary outline-none"
            />
            <button className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold">
              Open lesson
            </button>
          </form>
        </details>
      </main>
    </div>
  );
}
