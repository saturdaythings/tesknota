"use client";

import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { SectionHeader } from "@/components/ui/section-header";
import { useUser } from "@/lib/user-context";

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const router = useRouter();

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <>
      <Topbar category="Manage" title="Settings" />
      <main className="flex-1 overflow-y-auto p-[26px]">
        <SectionHeader title="Account" />
        {user && (
          <div className="border border-[var(--b2)] p-4 mb-6 max-w-[380px]">
            <div className="font-[var(--serif)] text-lg italic text-[var(--blue)] mb-1">
              {user.name}
            </div>
            <div className="font-[var(--mono)] text-[11px] text-[var(--ink3)] tracking-[0.08em] uppercase">
              {user.id}
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="font-[var(--mono)] text-xs tracking-[0.08em] px-4 py-[7px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--rose-tk)] hover:text-[var(--rose-tk)] transition-colors"
        >
          Sign out
        </button>
      </main>
    </>
  );
}
