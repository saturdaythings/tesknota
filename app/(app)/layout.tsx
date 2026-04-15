"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUser } from "@/lib/user-context";
import { DataProvider, useData } from "@/lib/data-context";
import { ToastProvider } from "@/components/ui/toast";
import { MobileNavProvider } from "@/lib/mobile-nav-context";
import { BotDrawer } from "@/components/ui/bot-drawer";
import { CmdPalette } from "@/components/ui/cmd-palette";
import type { UserProfile } from "@/types";

const WISHLIST_STATUSES = new Set([
  "WANT_TO_BUY",
  "WANT_TO_SMELL",
  "WANT_TO_IDENTIFY",
]);

function DataErrorBanner() {
  const { loadError, reload } = useData();
  if (!loadError) return null;
  return (
    <div
      style={{
        background: "var(--color-danger)",
        color: "var(--color-text-inverse)",
        fontFamily: "var(--font-sans)",
        fontSize: "var(--text-sm)",
        padding: "8px var(--space-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <span>Failed to load data. Check your connection.</span>
      <button
        onClick={reload}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          textDecoration: "underline",
          fontSize: "inherit",
          marginLeft: "var(--space-4)",
        }}
      >
        Retry
      </button>
    </div>
  );
}

function AppShellWithNav({
  children,
  user,
  profiles,
  onSignOut,
}: {
  children: React.ReactNode;
  user: UserProfile;
  profiles: UserProfile[];
  onSignOut: () => void;
}) {
  const { fragrances, compliments } = useData();

  const friends = profiles.filter((p) => p.id !== user.id);

  const counts = {
    collection: fragrances.length,
    wishlist: fragrances.filter((f) => WISHLIST_STATUSES.has(f.status)).length,
    compliments: compliments.length,
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          user={user}
          friends={friends}
          counts={counts}
          onSignOut={onSignOut}
        />
      }
    >
      <DataErrorBanner />
      {children}
      <BotDrawer />
      <CmdPalette />
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profiles, isLoaded, signOut } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) router.replace("/");
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <MobileNavProvider>
      <DataProvider>
        <ToastProvider>
          <AppShellWithNav
            user={user}
            profiles={profiles}
            onSignOut={handleSignOut}
          >
            {children}
          </AppShellWithNav>
        </ToastProvider>
      </DataProvider>
    </MobileNavProvider>
  );
}
