"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { FloatingActionButton } from '@/components/layout/FloatingActionButton';
import { AddFragranceModal } from '@/components/collection/add-fragrance-modal';
import { FragranceDetailModal } from '@/components/collection/fragrance-detail-modal';
import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { AddToWishlistModal } from '@/components/wishlist/add-to-wishlist-modal';
import { useUser } from '@/lib/user-context';
import { DataProvider, useData } from '@/lib/data-context';
import { ToastProvider } from '@/components/ui/toast';
import { MobileNavProvider } from '@/lib/mobile-nav-context';
import { BotDrawer } from '@/components/ui/bot-drawer';
import { CmdPalette } from '@/components/ui/cmd-palette';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { UserFragrance, UserCompliment } from '@/types';

function DataErrorBanner() {
  const { loadError, reload } = useData();
  if (!loadError) return null;
  return (
    <div
      className="flex items-center justify-between px-5 py-2 font-sans text-[length:var(--text-sm)] flex-shrink-0"
      style={{ background: 'var(--color-destructive)', color: 'var(--color-cream)' }}
    >
      <span>Failed to load data. Check your connection.</span>
      <Button
        variant="ghost"
        className="underline ml-4 hover:no-underline p-0 h-auto"
        style={{ color: 'inherit' }}
        onClick={reload}
      >
        Retry
      </Button>
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
  const { fragrances, compliments, removeFrag } = useData();
  const [addFragOpen, setAddFragOpen] = useState(false);
  const [addCompOpen, setAddCompOpen] = useState(false);
  const [addWishOpen, setAddWishOpen] = useState(false);

  // FAB edit-action state
  const [fragPickerOpen, setFragPickerOpen] = useState(false);
  const [fragPickerQuery, setFragPickerQuery] = useState('');
  const [editFragTarget, setEditFragTarget] = useState<UserFragrance | null>(null);
  const [fragDetailOpen, setFragDetailOpen] = useState(false);
  const [compPickerOpen, setCompPickerOpen] = useState(false);
  const [compPickerQuery, setCompPickerQuery] = useState('');
  const [editCompTarget, setEditCompTarget] = useState<UserCompliment | null>(null);
  const [editCompOpen, setEditCompOpen] = useState(false);
  const [openFlagCount, setOpenFlagCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingFollowCount, setPendingFollowCount] = useState(0);

  const refreshFlagCount = useCallback(async () => {
    if (!user.isAdmin) return;
    const { count } = await supabase
      .from("community_flags")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false);
    setOpenFlagCount(count ?? 0);
  }, [user.isAdmin]);

  const refreshPendingCount = useCallback(async () => {
    if (!user.isAdmin) return;
    const { count } = await supabase
      .from("pending_entries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, [user.isAdmin]);

  const refreshFollowCount = useCallback(async () => {
    const { count } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id)
      .eq("status", "pending");
    setPendingFollowCount(count ?? 0);
  }, [user.id]);

  useEffect(() => { refreshFlagCount(); }, [refreshFlagCount]);
  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);
  useEffect(() => { refreshFollowCount(); }, [refreshFollowCount]);

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
        { href: '/social', label: 'Social', pendingDot: pendingFollowCount > 0 },
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
        { href: '/admin', label: 'Admin Dashboard', exact: true, hasNewActivity: openFlagCount > 0, pendingDot: pendingCount > 0 },
        { href: '/admin/design', label: 'Design System' },
      ],
    }] : []),
  ];

  function handleFabAction(action: string) {
    if (action === 'add-fragrance') setAddFragOpen(true);
    else if (action === 'log-compliment') setAddCompOpen(true);
    else if (action === 'add-wishlist') setAddWishOpen(true);
    else if (action === 'edit-fragrance' || action === 'change-status' || action === 'remove-fragrance') {
      setFragPickerQuery('');
      setFragPickerOpen(true);
    } else if (action === 'edit-compliment' || action === 'delete-compliment') {
      setCompPickerQuery('');
      setCompPickerOpen(true);
    }
  }

  const myFrags = fragrances.filter((f) => f.userId === user.id);
  const myComps = compliments.filter((c) => c.userId === user.id);

  const fragPickerResults = myFrags
    .filter((f) => !fragPickerQuery || f.name.toLowerCase().includes(fragPickerQuery.toLowerCase()) || f.house.toLowerCase().includes(fragPickerQuery.toLowerCase()))
    .slice(0, 10);

  const compPickerResults = myComps
    .filter((c) => !compPickerQuery || (c.primaryFrag ?? '').toLowerCase().includes(compPickerQuery.toLowerCase()))
    .slice(0, 10);

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
      <ToastProvider>
        <AddFragranceModal open={addFragOpen} onClose={() => setAddFragOpen(false)} />
        <LogComplimentModal
          open={addCompOpen || editCompOpen}
          onClose={() => { setAddCompOpen(false); setEditCompOpen(false); setEditCompTarget(null); }}
          editing={editCompTarget}
        />
        <AddToWishlistModal open={addWishOpen} onClose={() => setAddWishOpen(false)} />
        <FragranceDetailModal
          open={fragDetailOpen}
          frag={editFragTarget}
          onClose={() => { setFragDetailOpen(false); setEditFragTarget(null); }}
          compliments={myComps}
          userId={user.id}
          onDelete={(f) => { removeFrag(f.id); setFragDetailOpen(false); setEditFragTarget(null); }}
        />

        {/* Fragrance picker for FAB edit/change-status/remove actions */}
        {fragPickerOpen && (
          <div
            className="fixed inset-0 z-[600]"
            style={{ background: 'var(--color-navy-backdrop)' }}
            onClick={() => setFragPickerOpen(false)}
          >
            <div
              className="fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-[480px] bg-[var(--color-cream)] border border-[var(--color-sand-light)] z-[601]"
              style={{ boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-cream-dark)' }}>
                <div className="font-sans uppercase mb-3" style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy-mid)' }}>
                  Select a fragrance
                </div>
                <Input
                  value={fragPickerQuery}
                  onChange={(e) => setFragPickerQuery(e.target.value)}
                  placeholder="Search by name or house..."
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {fragPickerResults.map((f) => (
                  <Button
                    key={f.id}
                    variant="ghost"
                    className="w-full justify-between px-5 py-3 h-auto min-h-0 rounded-none"
                    style={{ borderBottom: '1px solid var(--color-row-divider)' }}
                    onClick={() => { setEditFragTarget(f); setFragDetailOpen(true); setFragPickerOpen(false); }}
                  >
                    <span className="font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{f.name}</span>
                    <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{f.house}</span>
                  </Button>
                ))}
                {fragPickerResults.length === 0 && (
                  <div className="px-5 py-4 font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-meta-text)' }}>
                    No fragrances found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compliment picker for FAB edit-compliment/delete-compliment actions */}
        {compPickerOpen && (
          <div
            className="fixed inset-0 z-[600]"
            style={{ background: 'var(--color-navy-backdrop)' }}
            onClick={() => setCompPickerOpen(false)}
          >
            <div
              className="fixed left-1/2 top-[15vh] -translate-x-1/2 w-full max-w-[480px] bg-[var(--color-cream)] border border-[var(--color-sand-light)] z-[601]"
              style={{ boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-cream-dark)' }}>
                <div className="font-sans uppercase mb-3" style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy-mid)' }}>
                  Select a compliment
                </div>
                <Input
                  value={compPickerQuery}
                  onChange={(e) => setCompPickerQuery(e.target.value)}
                  placeholder="Search by fragrance name..."
                  autoFocus
                />
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {compPickerResults.map((c) => (
                  <Button
                    key={c.id}
                    variant="ghost"
                    className="w-full justify-between px-5 py-3 h-auto min-h-0 rounded-none"
                    style={{ borderBottom: '1px solid var(--color-row-divider)' }}
                    onClick={() => { setEditCompTarget(c); setEditCompOpen(true); setCompPickerOpen(false); }}
                  >
                    <span className="font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>{c.primaryFrag}</span>
                    <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{c.month && c.year ? `${c.month}/${c.year}` : ''}</span>
                  </Button>
                ))}
                {compPickerResults.length === 0 && (
                  <div className="px-5 py-4 font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-meta-text)' }}>
                    No compliments found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
