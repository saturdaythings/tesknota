"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";
import type { UserProfile } from "@/types";
import {
  LayoutDashboard,
  FlaskConical,
  Heart,
  MessageCircle,
  BarChart3,
  Upload,
  Settings2,
  LogOut,
  X,
} from "lucide-react";

interface NavCounts {
  collection?: number;
  wishlist?: number;
  compliments?: number;
}

interface SidebarProps {
  user: UserProfile;
  friends: UserProfile[];
  counts?: NavCounts;
  onSignOut?: () => void;
  className?: string;
}

const MY_SPACE = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, countKey: null },
  { href: "/collection", label: "My Collection", icon: FlaskConical, countKey: "collection" as const },
  { href: "/wishlist", label: "Wishlist", icon: Heart, countKey: "wishlist" as const },
];

const EXPERIENCES = [
  { href: "/compliments", label: "Compliments", icon: MessageCircle, countKey: "compliments" as const },
  { href: "/analytics", label: "Analytics", icon: BarChart3, countKey: null },
];

const MANAGE = [
  { href: "/import", label: "Import", icon: Upload },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

function NavItem({
  href,
  label,
  icon: Icon,
  count,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        height: "38px",
        padding: "0 var(--space-3)",
        borderRadius: "var(--radius-sm)",
        fontSize: "var(--text-sm)",
        fontWeight: active ? 500 : 400,
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        background: active ? "var(--color-accent-subtle)" : "transparent",
        textDecoration: "none",
        transition: "background var(--transition-fast), color var(--transition-fast)",
        userSelect: "none",
      }}
      className={cn(
        "group",
        !active && "hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]",
      )}
    >
      <Icon
        size={16}
        aria-hidden="true"
        style={{ color: "inherit", flexShrink: 0 }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: active ? "var(--color-accent)" : "var(--color-text-muted)",
          }}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({
  children,
  first = false,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: "var(--text-xs)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        padding: "var(--space-3) var(--space-3) var(--space-2)",
        marginTop: first ? 0 : "var(--space-4)",
      }}
    >
      {children}
    </div>
  );
}

export function Sidebar({
  user,
  friends,
  counts = {},
  onSignOut,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { open, close } = useMobileNav();

  const initial = (user.name ?? "?")[0].toUpperCase();
  const displayedFriends = friends.slice(0, 5);
  const hasMore = friends.length > 5;

  const sidebarContent = (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: "240px",
        height: "100dvh",
        background: "var(--color-bg)",
        borderRight: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        overflow: "hidden",
        flexShrink: 0,
      }}
      className={cn(
        "fixed inset-y-0 left-0 z-[var(--z-modal)] md:relative md:inset-auto md:z-auto",
        "transition-transform duration-[250ms] ease-out",
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        className,
      )}
    >
      {/* Brand block */}
      <div
        style={{
          height: "64px",
          padding: "0 var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            className="font-display"
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              letterSpacing: "0.12em",
              lineHeight: 1.1,
            }}
          >
            TĘSKNOTA
          </div>
          <span
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
              marginTop: "2px",
            }}
          >
            fragrance tracker
          </span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={close}
          aria-label="Close menu"
          className="md:hidden"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            borderRadius: "var(--radius-sm)",
            padding: 0,
          }}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Nav sections — scrollable */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-4) var(--space-2)",
          overscrollBehavior: "contain",
        }}
      >
        <SectionLabel first>MY SPACE</SectionLabel>
        {MY_SPACE.map(({ href, label, icon, countKey }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            count={countKey ? counts[countKey] : undefined}
            active={pathname === href}
            onClick={close}
          />
        ))}

        <SectionLabel>EXPERIENCES</SectionLabel>
        {EXPERIENCES.map(({ href, label, icon, countKey }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            count={countKey ? counts[countKey] : undefined}
            active={pathname === href}
            onClick={close}
          />
        ))}

        <SectionLabel>MANAGE</SectionLabel>
        {MANAGE.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href}
            onClick={close}
          />
        ))}

        {/* Social section — only if there are connections */}
        {friends.length > 0 && (
          <>
            <SectionLabel>SOCIAL</SectionLabel>
            <div
              style={{
                maxHeight: `calc(5 * 38px + 32px)`,
                overflowY: "auto",
              }}
            >
              {displayedFriends.map((friend) => (
                <Link
                  key={friend.id}
                  href="/friend"
                  onClick={close}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "38px",
                    padding: "0 var(--space-3)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--text-sm)",
                    fontWeight: pathname === "/friend" ? 500 : 400,
                    color:
                      pathname === "/friend"
                        ? "var(--color-accent)"
                        : "var(--color-text-secondary)",
                    background:
                      pathname === "/friend"
                        ? "var(--color-accent-subtle)"
                        : "transparent",
                    textDecoration: "none",
                    transition:
                      "background var(--transition-fast), color var(--transition-fast)",
                  }}
                  className={
                    pathname !== "/friend"
                      ? "hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]"
                      : ""
                  }
                >
                  {friend.name}
                </Link>
              ))}
              {hasMore && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: "38px",
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-sm)",
                    fontStyle: "italic",
                    color: "var(--color-text-muted)",
                    cursor: "default",
                  }}
                >
                  See more
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {/* User block — fixed bottom */}
      <div
        style={{
          height: "64px",
          padding: "0 var(--space-3)",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          flexShrink: 0,
        }}
      >
        {/* Avatar */}
        <div
          aria-hidden="true"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-accent-subtle)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            color: "var(--color-accent)",
          }}
        >
          {initial}
        </div>

        {/* Name + admin badge */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              color: "var(--color-text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name}
          </span>
          {user.isAdmin && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: "18px",
                padding: "0 6px",
                borderRadius: "var(--radius-full)",
                background: "var(--color-surface-overlay)",
                color: "var(--color-text-secondary)",
                fontSize: "11px", /* intentional exception per spec */
                fontWeight: 600,
                letterSpacing: "0.03em",
                marginTop: "1px",
                width: "fit-content",
              }}
            >
              Admin
            </span>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={onSignOut}
          aria-label="Sign out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
            borderRadius: "var(--radius-sm)",
            padding: 0,
            flexShrink: 0,
            transition: "color var(--transition-fast)",
          }}
          className="hover:text-[var(--color-danger)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        className="md:hidden"
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26,24,22,0.4)",
          zIndex: "calc(var(--z-modal) - 1)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 200ms ease",
        }}
      />
      {sidebarContent}
    </>
  );
}
