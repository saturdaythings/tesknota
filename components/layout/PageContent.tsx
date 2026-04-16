"use client";

import { cn } from "@/lib/utils";

interface PageContentProps {
  children: React.ReactNode;
  /** Override max-width for narrow-form pages (e.g. Settings). Default: 1400px */
  maxWidth?: string;
  className?: string;
}

/**
 * Canonical page content wrapper.
 *
 * Enforces the design baseline for every page:
 *   - main: flex-1, overflow-y-auto
 *   - inner container: maxWidth 1400px (or override), centered, padding tokens
 *   - mobile: padding shrinks to var(--space-4) both axes
 *
 * Usage:
 *   <Topbar title="My Page" />
 *   <PageContent>
 *     ...page content...
 *   </PageContent>
 *
 * Do NOT write a <main> tag directly in pages — use this component.
 */
export function PageContent({ children, maxWidth = "1400px", className }: PageContentProps) {
  return (
    <main style={{ flex: 1, overflowY: "auto" }}>
      <div
        style={{ maxWidth, margin: "0 auto", padding: "var(--space-6) 26px" }}
        className={cn("max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]", className)}
      >
        {children}
      </div>
    </main>
  );
}
