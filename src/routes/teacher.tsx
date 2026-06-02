import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

function TeacherLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/teacher" className="font-bold text-lg flex items-center gap-2">
            <span>🧬</span> Aghamorph <span className="text-muted-foreground font-normal">/ Teacher</span>
          </Link>
          <Link to="/" className="ml-auto text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            Student view
          </Link>
          <button
            onClick={() => navigate({ to: "/" })}
            className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-secondary"
          >
            Leave
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
