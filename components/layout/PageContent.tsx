"use client";

import { cn } from "@/lib/utils";

interface PageContentProps {
  children: React.ReactNode;
  /** Override max-width for narrow-form pages (e.g. Settings). Defaults to --page-content-max-width (1400px). */
  maxWidth?: string;
}

export function PageContent({ children, maxWidth }: PageContentProps) {
  return (
    <main style={{ flex: 1, overflowY: "auto" }}>
      <div
        style={{
          maxWidth: maxWidth ?? "var(--page-content-max-width)",
          margin: "0 auto",
        }}
        className={cn(
          "px-[var(--page-margin)] py-[var(--space-6)]",
          "max-sm:px-[var(--topbar-px-mobile)] max-sm:py-[var(--space-4)]",
        )}
      >
        {children}
      </div>
    </main>
  );
}
