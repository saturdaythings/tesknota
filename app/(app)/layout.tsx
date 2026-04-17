"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { AddFragranceModal } from '@/components/collection/add-fragrance-modal';
import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { AddToWishlistModal } from '@/components/wishlist/add-to-wishlist-modal';
import { useUser, getFriend } from '@/lib/user-context';
import { DataProvider, useData } from '@/lib/data-context';
import { ToastProvider } from '@/components/ui/toast';
import { MobileNavProvider } from '@/lib/mobile-nav-context';
import { BotDrawer } from '@/components/ui/bot-drawer';
import { CmdPalette } from '@/components/ui/cmd-palette';

function DataErrorBanner() {
  const { loadError, reload } = useData();
  if (!loadError) return null;
  return (
    <div
      className="flex items-center justify-between px-5 py-2 font-sans text-[13px] flex-shrink-0"
      style={{ background: 'var(--color-destructive)', color: 'var(--color-cream)' }}
    >
      <span>Failed to load data. Check your connection.</span>
      <button
        onClick={reload}
        className="underline ml-4 hover:no-underline bg-transparent border-none cursor-pointer"
        style={{ color: 'inherit' }}
      >
        Retry
      </button>
    </div>
  );
}

function AppLayoutInner({ children, user, profiles, signOut }: {
  children: React.ReactNode;
  user: NonNullable<ReturnType<typeof useUser>['user']>;
  profiles: ReturnType<typeof useUser>['profiles'];
  signOut: () => Promise<void>;
}) {
  const router = useRouter();
  const { fragrances, compliments } = useData();
  const [addFragOpen, setAddFragOpen] = useState(false);
  const [addCompOpen, setAddCompOpen] = useState(false);
  const [addWishOpen, setAddWishOpen] = useState(false);
  const friend = getFriend(user, profiles);

  const collectionCount = fragrances.filter((f) => f.status === 'CURRENT').length;
  const wishlistCount = fragrances.filter((f) => f.status === 'WANT_TO_BUY' || f.status === 'WANT_TO_SMELL').length;
  const complimentsCount = compliments.length;

  const navSections = [
    {
      label: 'My Space',
      items: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/collection', label: 'My Collection', count: collectionCount },
        { href: '/wishlist', label: 'Wishlist', count: wishlistCount },
      ],
    },
    {
      label: 'Experiences',
      items: [
        { href: '/compliments', label: 'Compliments', count: complimentsCount },
        { href: '/analytics', label: 'Analytics' },
      ],
    },
    {
      label: 'Social',
      items: [
        { href: '/friend', label: friend?.name ?? 'Friend' },
      ],
    },
    {
      label: 'Manage',
      items: [
        { href: '/import', label: 'Import' },
        { href: '/settings', label: 'Settings' },
      ],
    },
    ...(user.isAdmin ? [{
      label: 'Admin',
      items: [
        { href: '/admin', label: 'Admin Dashboard', exact: true },
        { href: '/admin/design', label: 'Design System' },
      ],
    }] : []),
  ];

  function handleFabAction(action: string) {
    if (action === 'add-fragrance') setAddFragOpen(true);
    else if (action === 'log-compliment') setAddCompOpen(true);
    else if (action === 'add-wishlist') setAddWishOpen(true);
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          navSections={navSections}
          userName={user.name}
          onSignOut={async () => {
            await signOut();
            router.push('/');
          }}
        />
      }
    >
      <AddFragranceModal open={addFragOpen} onClose={() => setAddFragOpen(false)} />
      <LogComplimentModal open={addCompOpen} onClose={() => setAddCompOpen(false)} />
      <AddToWishlistModal open={addWishOpen} onClose={() => setAddWishOpen(false)} />
      <ToastProvider>
        <DataErrorBanner />
        {children}
        <BotDrawer />
        <CmdPalette />
      </ToastProvider>
      <FloatingActionButton onAction={handleFabAction} />
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profiles, isLoaded, signOut } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) router.replace('/');
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) return null;

  return (
    <MobileNavProvider>
      <DataProvider userId={user.id}>
        <AppLayoutInner user={user} profiles={profiles} signOut={signOut}>
          {children}
        </AppLayoutInner>
      </DataProvider>
    </MobileNavProvider>
  );
}
