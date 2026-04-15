"use client";

import { cn } from "@/lib/utils";
import { useMobileNav } from "@/lib/mobile-nav-context";
import { Menu } from "lucide-react";

interface TopbarProps {
  title: string;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, search, actions, className }: TopbarProps) {
  const { toggle } = useMobileNav();

  return (
    <header
      style={{
        height: "64px",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        padding: "0 var(--space-6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: "var(--z-sticky)",
        gap: "var(--space-4)",
        flexShrink: 0,
      }}
      className={cn(className)}
    >
      {/* Left: hamburger + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          minWidth: 0,
          flex: 1,
        }}
      >
        <button
          onClick={toggle}
          aria-label="Open menu"
          className="md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
            borderRadius: "var(--radius-sm)",
            padding: 0,
            flexShrink: 0,
            transition: "color var(--transition-fast)",
          }}
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <h1
          className="text-page-title truncate"
          style={{ minWidth: 0 }}
        >
          {title}
        </h1>
      </div>

      {/* Center: search slot */}
      {search && (
        <div
          style={{
            maxWidth: "360px",
            flex: 1,
            flexShrink: 0,
          }}
        >
          {search}
        </div>
      )}

      {/* Right: actions slot */}
      {actions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}
