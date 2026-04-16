"use client";

import { cn } from "@/lib/utils";

interface PageContentProps {
  children: React.ReactNode;
  /** Constrain inner content width for narrow-form pages (e.g. Settings). Optional. */
  maxWidth?: string;
  className?: string;
}

/**
 * Canonical page content wrapper.
 *
 * Padding uses --page-margin (= --topbar-px) so left and right always match the topbar exactly.
 * No centering, no hardcoded widths. Pass maxWidth only for narrow-form admin pages.
 *
 * Do NOT write a <main> tag directly in pages — use this component.
 */
export function PageContent({ children, maxWidth, className }: PageContentProps) {
  return (
    <main style={{ flex: 1, overflowY: "auto" }}>
      <div
        style={maxWidth ? { maxWidth } : undefined}
        className={cn(
          "px-[var(--page-margin)] py-[var(--space-6)]",
          "max-md:px-[var(--topbar-px-mobile)] max-md:py-[var(--space-4)]",
          className,
        )}
      >
        {children}
      </div>
    </main>
  );
}
