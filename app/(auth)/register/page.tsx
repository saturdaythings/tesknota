"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchProfileByUsername } from "@/lib/data/index";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkUsername = useCallback(async () => {
    const val = username.trim();
    if (!val) { setUsernameError(""); return; }
    const existing = await fetchProfileByUsername(val);
    setUsernameError(existing ? "Username is already taken." : "");
  }, [username]);

  function handleConfirmBlur() {
    if (confirmPassword && confirmPassword !== password) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }
    if (usernameError) return;

    setLoading(true);
    try {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpErr) throw new Error(signUpErr.message);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("Account created but no user ID returned.");

      const { error: profileErr } = await supabase.from("profiles").insert({
        id: userId,
        email: email.trim(),
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        username: username.trim() || null,
        show_collection: true,
        show_followers: true,
        show_following: true,
        show_social_handles: false,
        show_discount_codes: false,
      });
      if (profileErr) throw new Error(profileErr.message);

      router.push("/profile?onboarding=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
    color: "var(--color-navy)",
    marginBottom: "var(--space-1)",
    display: "block",
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 overflow-y-auto py-12"
      style={{ background: "var(--color-cream)" }}
    >
      {/* Wordmark */}
      <div className="text-center mb-10">
        <div
          className="font-serif italic leading-none"
          style={{ fontSize: "72px", color: "var(--color-navy)" }}
        >
          t&#281;sknota
        </div>
        <div
          className="font-sans font-medium uppercase mt-3"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-meta-text)",
            letterSpacing: "0.22em",
          }}
        >
          Fragrance Tracker
        </div>
        <div
          className="font-serif italic mt-3"
          style={{ fontSize: "20px", color: "var(--color-navy)", opacity: 0.6, lineHeight: 1.5 }}
        >
          [ t&#603;sk-&#712;n&#596;-ta ] &nbsp;&middot;&nbsp; a deep longing for what is absent or past
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: "var(--color-cream-dark)",
          border: "1px solid var(--color-row-divider)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: "var(--space-3)" }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
          </div>

          <div>
            <label style={labelStyle}>Last Name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
          </div>

          <div>
            <label style={labelStyle}>Username</label>
            <Input
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameError(""); }}
              onBlur={checkUsername}
              placeholder="username"
              autoComplete="username"
            />
            {usernameError && (
              <p className="font-sans mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--color-destructive)" }}>
                {usernameError}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
              onBlur={handleConfirmBlur}
              placeholder="Confirm password"
              autoComplete="new-password"
              required
            />
            {confirmError && (
              <p className="font-sans mt-1" style={{ fontSize: "var(--text-xs)", color: "var(--color-destructive)" }}>
                {confirmError}
              </p>
            )}
          </div>

          {error && (
            <p className="font-sans" style={{ fontSize: "var(--text-xs)", color: "var(--color-destructive)" }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={loading || !!usernameError}
            className="w-full mt-1"
          >
            {loading ? <><Spinner /> Creating account...</> : "Create Account"}
          </Button>
        </form>

        <div
          className="flex items-center justify-center gap-1 mt-4 font-sans"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-meta-text)" }}
        >
          Already have an account?
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
