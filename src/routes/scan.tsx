import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StudentHeader } from "@/components/student-header";
import { useState } from "react";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [{ title: "Scan QR — Aghamorph" }],
  }),
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState("");

  const open = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    // Accept either a full URL or a bare video id
    try {
      const u = new URL(trimmed);
      const m = u.pathname.match(/\/play\/([^/?#]+)/);
      if (m) {
        navigate({ to: "/play/$videoId", params: { videoId: m[1] } });
        return;
      }
    } catch {
      /* not a URL */
    }
    navigate({ to: "/play/$videoId", params: { videoId: trimmed } });
  };

  return (
    <div className="min-h-screen">
      <StudentHeader />
      <main className="mx-auto max-w-xl px-4 py-10">
        <Link to="/student" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-3xl font-extrabold mt-3 mb-2">Open a lesson</h1>
        <p className="text-muted-foreground mb-6">
          Scan the QR code your teacher shared using your phone's camera — it will open the
          lesson automatically. On a computer, paste the lesson link below.
        </p>

        <form onSubmit={open} className="bg-card border rounded-2xl p-5 space-y-3">
          <label className="block text-sm font-semibold">Lesson link or code</label>
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
      </main>
    </div>
  );
}
