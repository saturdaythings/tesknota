"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUser, getFriend } from "@/lib/user-context";
import { DataProvider } from "@/lib/data-context";
import { ToastProvider } from "@/components/ui/toast";
import { MobileNavProvider } from "@/lib/mobile-nav-context";
import { BotDrawer } from "@/components/ui/bot-drawer";
import { CmdPalette } from "@/components/ui/cmd-palette";
import { useData } from "@/lib/data-context";

function DataErrorBanner() {
  const { loadError, reload } = useData();
  if (!loadError) return null;
  return (
    <div className="bg-[var(--rose-tk)] text-white font-[var(--mono)] text-xs px-4 py-2 flex items-center justify-between shrink-0">
      <span>Failed to load data. Check your connection.</span>
      <button onClick={reload} className="underline ml-4 hover:no-underline">Retry</button>
    </div>
  );
}

const NAV_SECTIONS_BASE = [
  {
    label: "My Space",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/collection", label: "My Collection" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    label: "Experiences",
    items: [
      { href: "/compliments", label: "Compliments" },
      { href: "/analytics", label: "Analytics" },
    ],
  },
];

const NAV_MANAGE = {
  label: "Manage",
  items: [
    { href: "/import", label: "Import" },
    { href: "/settings", label: "Settings" },
  ],
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profiles, isLoaded, signOut } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) router.replace("/");
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return null;

  const friend = getFriend(user, profiles);
  const navSections = [
    ...NAV_SECTIONS_BASE,
    {
      label: "Social",
      items: [{ href: "/friend", label: friend?.name ?? "Friend" }],
    },
    NAV_MANAGE,
  ];

  return (
    <MobileNavProvider>
      <AppShell
        sidebar={
          <Sidebar
            navSections={navSections}
            userName={user.name}
            onSignOut={async () => {
              await signOut();
              router.push("/");
            }}
            onUserClick={() => router.push("/settings")}
          />
        }
      >
        <DataProvider>
          <ToastProvider>
            <DataErrorBanner />
            {children}
            <BotDrawer />
            <CmdPalette />
          </ToastProvider>
        </DataProvider>
      </AppShell>
    </MobileNavProvider>
  );
}
