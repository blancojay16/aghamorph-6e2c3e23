import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aghamorph — Choose your role" },
      { name: "description", content: "Are you a student or a teacher?" },
    ],
  }),
  component: RoleChooser,
});

function RoleChooser() {
  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 bg-gradient-to-br from-background to-secondary/40">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🧬</div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-3">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-primary to-[oklch(0.7_0.18_220)] bg-clip-text text-transparent">
              Aghamorph
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose how you want to enter today
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            to="/student"
            className="group rounded-3xl p-8 bg-card border-2 hover:border-primary shadow-sm hover:shadow-xl transition text-center"
          >
            <div className="text-7xl mb-4 group-hover:scale-110 transition">🎒</div>
            <h2 className="text-2xl font-extrabold mb-2">I'm a Student</h2>
            <p className="text-muted-foreground mb-5">
              Watch lessons, play games, earn badges, and scan QR codes from your teacher.
            </p>
            <span className="inline-block px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-bold">
              Enter as Student →
            </span>
          </Link>

          <Link
            to="/teacher"
            className="group rounded-3xl p-8 bg-card border-2 hover:border-accent shadow-sm hover:shadow-xl transition text-center"
          >
            <div className="text-7xl mb-4 group-hover:scale-110 transition">👩‍🏫</div>
            <h2 className="text-2xl font-extrabold mb-2">I'm a Teacher</h2>
            <p className="text-muted-foreground mb-5">
              Upload lessons, edit checkpoints, and share QR codes so students can scan and learn.
            </p>
            <span className="inline-block px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-bold">
              Enter as Teacher →
            </span>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          You can switch roles anytime from the top of any page.
        </p>
      </div>
    </div>
  );
}
