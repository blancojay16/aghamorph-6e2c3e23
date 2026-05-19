import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTeacherSession } from "@/hooks/use-teacher-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

function TeacherLayout() {
  const { session, loading } = useTeacherSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = path === "/teacher/login";

  useEffect(() => {
    if (!loading && !session && !isLogin) navigate({ to: "/teacher/login" });
  }, [loading, session, navigate, isLogin]);

  if (isLogin) return <Outlet />;
  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }
  if (!session) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-card border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/teacher" className="font-bold text-lg flex items-center gap-2">
            <span>🧬</span> Aghamorph <span className="text-muted-foreground font-normal">/ Teacher</span>
          </Link>
          <span className="ml-auto text-sm text-muted-foreground hidden sm:inline">
            {session.user.email}
          </span>
          <Link to="/" className="text-sm px-3 py-1.5 rounded-full hover:bg-muted">
            Student view
          </Link>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm px-3 py-1.5 rounded-full bg-muted hover:bg-secondary"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
