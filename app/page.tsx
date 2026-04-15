"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";

export default function IdentityScreen() {
  const { user, profiles, isLoaded, signIn, signUp } = useUser();
  const router = useRouter();

  const [mode, setMode] = useState<"select" | "signin" | "signup">("select");
  const [selectedEmail, setSelectedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && user) router.replace("/dashboard");
  }, [isLoaded, user, router]);

  function pickProfile(email: string) {
    setSelectedEmail(email);
    setPassword("");
    setError("");
    setMode("signin");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await signIn(selectedEmail, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/dashboard");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    const { error: err } = await signUp(selectedEmail, password, name.trim());
    setLoading(false);
    if (err) { setError(err); return; }
    router.push("/dashboard");
  }

  function reset() {
    setMode("select");
    setSelectedEmail("");
    setPassword("");
    setName("");
    setError("");
  }

  return (
    <div className="fixed inset-0 bg-[var(--blue3)] flex flex-col items-center justify-start pt-[22dvh] px-8">
      {/* Wordmark */}
      <div className="text-center mb-14">
        <div className="font-[var(--script)] text-[64px] italic text-[var(--warm2)] tracking-[0.02em] leading-none">
          tęsknota
        </div>
        <div className="font-[var(--mono)] text-[11px] tracking-[0.28em] uppercase text-white/70 mt-3">
          Fragrance Tracker
        </div>
        <div className="h-5" />
        <div className="font-[var(--script)] text-[15px] italic text-[rgba(var(--warm-ch),0.72)] leading-[1.5] tracking-[0.01em]">
          [ tɛsk-ˈnɔ-ta ] &nbsp;·&nbsp; a deep longing for what is absent or past
        </div>
      </div>

      {/* Profile select */}
      {mode === "select" && (
        <div className="flex flex-col items-center w-full max-w-[320px]">
          <div className="font-[var(--body)] text-sm text-white/70 mb-6 tracking-[0.04em] text-center">
            Who are you?
          </div>
          <div className="flex flex-col gap-3 w-full">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => pickProfile(p.email)}
                className="w-full min-h-[56px] bg-[rgba(var(--warm-ch),0.15)] border border-[rgba(var(--warm-ch),0.35)] text-[rgba(var(--warm2-ch),0.92)] font-[var(--script)] text-2xl italic px-11 cursor-pointer tracking-[0.04em] transition-all duration-[180ms] hover:bg-[rgba(var(--warm-ch),0.28)]"
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => { setMode("signup"); setSelectedEmail(""); setPassword(""); setName(""); setError(""); }}
              className="w-full py-2.5 font-[var(--mono)] text-[11px] tracking-[0.14em] uppercase text-white/40 hover:text-white/60 transition-colors border border-white/10 hover:border-white/20 mt-1"
            >
              Create account
            </button>
          </div>
        </div>
      )}

      {/* Sign in */}
      {mode === "signin" && (
        <form onSubmit={handleSignIn} className="flex flex-col gap-3 w-full max-w-[320px]">
          <div className="font-[var(--body)] text-sm text-white/70 mb-2 tracking-[0.04em] text-center">
            Enter your password
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.15)] text-white font-[var(--body)] text-sm placeholder:text-white/30 focus:outline-none focus:border-[rgba(var(--warm-ch),0.6)]"
          />
          {error && (
            <div className="font-[var(--mono)] text-[11px] text-[var(--rose-tk)] tracking-[0.04em]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-[rgba(var(--warm-ch),0.22)] border border-[rgba(var(--warm-ch),0.45)] text-[rgba(var(--warm2-ch),0.92)] font-[var(--mono)] text-[11px] tracking-[0.14em] uppercase disabled:opacity-50 hover:bg-[rgba(var(--warm-ch),0.32)] transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-white/30 hover:text-white/50 transition-colors pt-1"
          >
            Back
          </button>
        </form>
      )}

      {/* Sign up */}
      {mode === "signup" && (
        <form onSubmit={handleSignUp} className="flex flex-col gap-3 w-full max-w-[320px]">
          <div className="font-[var(--body)] text-sm text-white/70 mb-2 tracking-[0.04em] text-center">
            Create your account
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.15)] text-white font-[var(--body)] text-sm placeholder:text-white/30 focus:outline-none focus:border-[rgba(var(--warm-ch),0.6)]"
          />
          <input
            type="email"
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.15)] text-white font-[var(--body)] text-sm placeholder:text-white/30 focus:outline-none focus:border-[rgba(var(--warm-ch),0.6)]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.15)] text-white font-[var(--body)] text-sm placeholder:text-white/30 focus:outline-none focus:border-[rgba(var(--warm-ch),0.6)]"
          />
          {error && (
            <div className="font-[var(--mono)] text-[11px] text-[var(--rose-tk)] tracking-[0.04em]">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] bg-[rgba(var(--warm-ch),0.22)] border border-[rgba(var(--warm-ch),0.45)] text-[rgba(var(--warm2-ch),0.92)] font-[var(--mono)] text-[11px] tracking-[0.14em] uppercase disabled:opacity-50 hover:bg-[rgba(var(--warm-ch),0.32)] transition-colors"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-white/30 hover:text-white/50 transition-colors pt-1"
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}
