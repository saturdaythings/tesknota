"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMobileNav } from '@/lib/mobile-nav-context';
import { Button } from '@/components/ui/button';
import { LogOut } from '@/components/ui/Icons';

interface NavItem {
  href: string;
  label: string;
  count?: number;
  hasNewActivity?: boolean;
  pendingDot?: boolean;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  navSections: NavSection[];
  userName: string;
  onSignOut?: () => void;
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className="ml-auto font-sans tabular-nums"
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--font-weight-normal)',
        letterSpacing: 'var(--tracking-sm)',
        color: active ? 'var(--color-cream)' : 'var(--color-sand-muted)',
      }}
    >
      {count}
    </span>
  );
}

function LiveDot() {
  return (
    <span
      className="ml-1 inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: 'var(--color-live)' }}
      aria-label="New activity"
    />
  );
}

function PendingDot() {
  return (
    <span
      style={{
        position: 'absolute',
        top: '-2px',
        right: '-5px',
        width: '8px',
        height: '8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-accent)',
        flexShrink: 0,
      }}
      aria-label="Pending entries"
    />
  );
}

export function Sidebar({ navSections, userName, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { open, close } = useMobileNav();

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          'fixed inset-0 z-[299] md:hidden transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        style={{
          background: 'var(--color-navy-backdrop)',
          transitionDuration: 'var(--motion-slow)',
        }}
      />

      <aside
        className={cn(
          'flex flex-col flex-shrink-0 z-[300] h-dvh overflow-hidden',
          'w-[var(--sidebar-width)]',
          'fixed top-0 left-0 transition-transform',
          'md:relative md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
        style={{
          background: 'var(--color-navy)',
          transitionDuration: 'var(--motion-slow)',
        }}
      >
        {/* Logo area */}
        <div className="px-5 pt-8 pb-6 flex-shrink-0">
          <div
            className="font-serif italic leading-none mb-1"
            style={{ fontSize: 'var(--text-logo)', color: 'var(--color-cream)' }}
          >
            t&#281;sknota
          </div>
          <div
            className="font-sans font-medium uppercase leading-none mb-3"
            style={{
              fontSize: 'var(--text-xxs)',
              color: 'var(--color-cream-muted)',
              letterSpacing: 'var(--tracking-xl)',
            }}
          >
            Fragrance Tracker
          </div>
          <div
            className="font-serif italic leading-snug"
            style={{ fontSize: 'var(--text-md)', color: 'var(--color-sand)' }}
          >
            [ t&#603;sk-&#712;n&#596;-ta ] &middot; a deep longing for what is absent or past
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto pb-2">
          {navSections.map((section) => (
            <div key={section.label} style={{ marginTop: 'var(--space-5)' }}>
              <div
                className="px-5 font-sans font-medium uppercase"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-sand-label)',
                  letterSpacing: 'var(--tracking-sm)',
                  lineHeight: 'var(--leading-none)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                {section.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="flex items-center transition-colors"
                      style={{
                        height: 'var(--space-8)',
                        paddingLeft: 'var(--space-5)',
                        paddingRight: 'var(--space-5)',
                        borderLeft: isActive
                          ? '3px solid var(--color-cream)'
                          : '3px solid transparent',
                        background: isActive ? 'var(--color-white-subtle)' : 'transparent',
                        color: isActive
                          ? 'var(--color-cream)'
                          : 'var(--color-sand-muted)',
                        fontSize: 'var(--text-xs)',
                        letterSpacing: 'var(--tracking-xs)',
                        fontFamily: 'var(--font-sans)',
                        transitionDuration: 'var(--motion-fast)',
                      }}
                    >
                      <span className="flex-1 truncate" style={{ position: 'relative' }}>
                        {item.label}
                        {item.pendingDot && <PendingDot />}
                      </span>
                      {item.hasNewActivity && <LiveDot />}
                      {item.count !== undefined && <CountBadge count={item.count} active={isActive} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          className="flex-shrink-0 px-5 py-5 border-t"
          style={{ borderColor: 'var(--color-white-subtle)' }}
        >
          <Button
            variant="ghost"
            onClick={() => { close(); router.push('/profile'); }}
            className="flex items-center gap-3 w-full p-0 mb-3 text-left h-auto justify-start transition-opacity hover:opacity-80"
            style={{ transitionDuration: 'var(--motion-fast)' }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-white-subtle)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="font-serif italic" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-cream)' }}>
                {initials}
              </span>
            </div>
            <span
              className="font-sans truncate"
              style={{ fontSize: 'var(--text-ui)', color: 'var(--color-cream)' }}
            >
              {userName}
            </span>
          </Button>
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="flex items-center gap-1.5 font-sans font-medium uppercase p-0 h-auto transition-opacity hover:opacity-100"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-sand-muted)',
              letterSpacing: 'var(--tracking-sm)',
              transitionDuration: 'var(--motion-fast)',
            }}
          >
            <LogOut size={12} />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
