import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

const TEACHER_PIN_KEY = "teacher_pin_verified";

function TeacherLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = path === "/teacher/login";

  useEffect(() => {
    if (!isLogin && localStorage.getItem(TEACHER_PIN_KEY) !== "1") {
      navigate({ to: "/teacher/login" });
    }
  }, [navigate, isLogin]);

  if (isLogin) return <Outlet />;

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
            onClick={() => {
              localStorage.removeItem(TEACHER_PIN_KEY);
              navigate({ to: "/" });
            }}
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
