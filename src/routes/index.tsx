import { useHistory } from "react-router-dom";
import { useState } from "react";
import { GraduationCap, UserCog, X } from "lucide-react";

const TEACHER_PIN = "1234";

function RoleChooser() {
  const history = useHistory();
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === TEACHER_PIN) {
      setShowPin(false);
      setPin("");
      setError("");
      history.push("/teacher");
    } else {
      setError("Incorrect PIN");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-background to-secondary/40">
      <div className="w-full max-w-md text-center">
        <div className="text-5xl mb-2">🧬</div>
        <h1 className="text-3xl font-extrabold mb-10">Aghamorph</h1>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => history.push("/student")}
            className="group flex flex-col items-center justify-center gap-3 aspect-square rounded-3xl bg-card border-2 hover:border-primary hover:shadow-xl transition"
          >
            <GraduationCap className="!size-12 text-primary group-hover:scale-110 transition" />
            <span className="font-bold">Student</span>
          </button>

          <button
            onClick={() => { setShowPin(true); setError(""); setPin(""); }}
            className="group flex flex-col items-center justify-center gap-3 aspect-square rounded-3xl bg-card border-2 hover:border-accent hover:shadow-xl transition"
          >
            <UserCog className="!size-12 text-accent-foreground group-hover:scale-110 transition" />
            <span className="font-bold">Teacher</span>
          </button>
        </div>
      </div>

      {showPin && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setShowPin(false)}>
          <form
            onSubmit={submitPin}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border relative"
          >
            <button
              type="button"
              onClick={() => setShowPin(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <h2 className="text-xl font-bold mb-1">Teacher PIN</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter the 4-digit teacher PIN.</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
              placeholder="••••"
              className="w-full text-center tracking-[0.6em] text-2xl py-3 rounded-xl border-2 bg-background focus:border-primary outline-none"
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:scale-[1.01] transition"
            >
              Continue
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
