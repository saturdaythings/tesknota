"use client";

import { cn } from "@/lib/utils";

interface PageContentProps {
  children: React.ReactNode;
  /** Override max-width for narrow-form pages (e.g. Settings). Defaults to --page-content-max-width (1400px). */
  maxWidth?: string;
  className?: string;
}

/**
 * Canonical page content wrapper.
 *
 * Padding uses --page-margin (= --topbar-px) so left and right always match the topbar exactly.
 * Centered at --page-content-max-width by default. Pass maxWidth to override for narrow pages.
 *
 * Do NOT write a <main> tag directly in pages — use this component.
 */
export function PageContent({ children, maxWidth, className }: PageContentProps) {
  return (
    <main style={{ flex: 1, overflowY: "auto" }}>
      <div
        style={{
          maxWidth: maxWidth ?? "var(--page-content-max-width)",
          margin: "0 auto",
        }}
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
