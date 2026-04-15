"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, USERS } from "@/lib/user-context";

export default function IdentityScreen() {
  const { user, selectUser } = useUser();
  const router = useRouter();

  // If user is already selected, go straight to dashboard
  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  function handleSelect(u: (typeof USERS)[number]) {
    selectUser(u);
    router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 bg-[var(--blue3)] flex flex-col items-center justify-start pt-[30dvh] px-8">
      {/* Wordmark */}
      <div className="text-center mb-16">
        <div className="font-[var(--script)] text-[64px] italic text-[var(--warm2)] tracking-[0.02em] leading-none">
          tęsknota
        </div>
        <div className="font-[var(--mono)] text-[11px] tracking-[0.28em] uppercase text-white/70 mt-3">
          Fragrance Tracker
        </div>
        <div className="h-5" />
        <div className="font-[var(--script)] text-[15px] italic text-[rgba(var(--warm-ch),0.72)] leading-[1.5] tracking-[0.01em]">
          [ tɛsk-ˈnɔ-ta ] &nbsp;·&nbsp; a deep longing for what is absent or
          past
        </div>
      </div>

      {/* Picker */}
      <div className="flex flex-col items-center">
        <div className="font-[var(--body)] text-sm text-white/70 mb-6 tracking-[0.04em] text-center">
          Who are you?
        </div>
        <div className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto">
          {USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelect(u)}
              className="min-w-[160px] min-h-[56px] bg-[rgba(var(--warm-ch),0.15)] border border-[rgba(var(--warm-ch),0.35)] text-[rgba(var(--warm2-ch),0.92)] font-[var(--script)] text-2xl italic px-11 cursor-pointer tracking-[0.04em] transition-all duration-[180ms] hover:bg-[rgba(var(--warm-ch),0.28)] sm:min-w-[160px] w-full sm:w-auto"
            >
              {u.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
