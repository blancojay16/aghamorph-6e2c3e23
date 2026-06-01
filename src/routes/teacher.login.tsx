import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/teacher/login")({
  component: TeacherLogin,
});

const TEACHER_PIN = "1234";

function TeacherLogin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === TEACHER_PIN) {
      localStorage.setItem("teacher_pin_verified", "1");
      setError(false);
      navigate({ to: "/teacher" });
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-secondary to-background">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-xl p-8 border">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="text-3xl font-extrabold mt-3 mb-1">Teacher portal</h1>
        <p className="text-muted-foreground mb-6">Enter the teacher PIN to continue.</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            required
            placeholder="PIN (default: 1234)"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setError(false);
            }}
            className="w-full px-4 py-3 rounded-xl border-2 bg-background focus:border-primary outline-none text-center text-2xl tracking-[0.5em]"
          />
          {error && <p className="text-sm text-destructive text-center">Incorrect PIN</p>}
          <button
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.01] transition"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
