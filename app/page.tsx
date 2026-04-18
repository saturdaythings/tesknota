"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const USERS = [
  { name: 'Kiana', email: process.env.NEXT_PUBLIC_USER_KIANA_EMAIL ?? '' },
  { name: 'Sylvia', email: process.env.NEXT_PUBLIC_USER_SYLVIA_EMAIL ?? '' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<{ name: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function pick(user: { name: string; email: string }) {
    setSelected(user);
    setPassword('');
    setError('');
  }

  function back() {
    setSelected(null);
    setPassword('');
    setError('');
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: selected.email,
      password,
    });
    setLoading(false);
    if (err) {
      setError('Incorrect password');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--color-navy)' }}
    >
      {/* Wordmark */}
      <div className="text-center mb-12">
        <div
          className="font-serif italic leading-none"
          style={{ fontSize: '72px', color: 'var(--color-cream)' }}
        >
          t&#281;sknota
        </div>
        <div
          className="font-sans font-medium uppercase mt-3"
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-cream-muted)',
            letterSpacing: 'var(--tracking-xl)',
          }}
        >
          Fragrance Tracker
        </div>
        <div
          className="font-serif italic mt-3"
          style={{ fontSize: 'var(--text-lg)', color: 'var(--color-sand)', lineHeight: 1.5 }}
        >
          [ t&#603;sk-&#712;n&#596;-ta ] &nbsp;&middot;&nbsp; a deep longing for what is absent or past
        </div>
      </div>

      {/* User selection */}
      {!selected && (
        <div className="flex flex-col items-center w-full">
          <div
            className="font-sans text-center mb-4"
            style={{ fontSize: 'var(--text-ui)', color: 'var(--color-sand)' }}
          >
            Who are you?
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {USERS.map((u) => (
              <UserButton key={u.name} name={u.name} onClick={() => pick(u)} />
            ))}
          </div>
        </div>
      )}

      {/* Password form */}
      {selected && (
        <form
          onSubmit={handleSignIn}
          className="flex flex-col items-center gap-4 w-full"
          style={{ maxWidth: '320px' }}
        >
          <div
            className="font-serif italic text-center"
            style={{ fontSize: 'var(--text-empty-title)', color: 'var(--color-cream)', marginBottom: 'var(--space-1)' }}
          >
            {selected.name}
          </div>

          {/* Dark-adapted password input */}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            required
            className="w-full h-10 px-3 rounded-[3px] font-sans outline-none transition-[border-color] duration-150 placeholder:text-[var(--color-cream)]"
            style={{
              fontSize: 'var(--text-base)',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'var(--color-cream)',
              width: '320px',
            }}
          />

          {/* Error */}
          {error && (
            <div
              className="font-sans text-center"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--color-sand)' }}
            >
              {error}
            </div>
          )}

          {/* Sign in button — cream bg, navy text */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-[3px] font-sans font-medium tracking-[var(--tracking-wide)] transition-opacity disabled:opacity-60 hover:opacity-90"
            style={{
              width: '320px',
              height: '40px',
              fontSize: 'var(--text-sm)',
              background: 'var(--color-cream)',
              color: 'var(--color-navy)',
            }}
          >
            {loading ? (
              <>
                <Spinner />
                Signing in...
              </>
            ) : (
              'SIGN IN'
            )}
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={back}
            className="font-sans bg-transparent border-none cursor-pointer transition-opacity hover:opacity-100"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-sand)', opacity: 0.7 }}
          >
            BACK
          </button>

          {/* Register link */}
          <div
            className="font-sans text-center"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-cream-faint)' }}
          >
            New to t&#281;sknota?{' '}
            <Link
              href="/register"
              className="underline transition-opacity hover:opacity-100"
              style={{ color: 'var(--color-sand)', opacity: 0.7 }}
            >
              Create account
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

function UserButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-serif italic transition-all duration-150 border-none cursor-pointer"
      style={{
        width: '180px',
        height: '56px',
        fontSize: 'var(--text-page-title)',
        color: 'var(--color-cream)',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '4px',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255,255,255,0.18)';
        el.style.borderColor = 'rgba(255,255,255,0.35)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(255,255,255,0.1)';
        el.style.borderColor = 'rgba(255,255,255,0.2)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
      }}
    >
      {name}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path
        d="M7 1.5a5.5 5.5 0 015.5 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
