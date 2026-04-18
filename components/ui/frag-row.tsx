"use client";

import { STATUS_LABELS } from "@/types";
import type { FragranceStatus } from "@/types";

const STATUS_STYLE: Record<string, { color: string }> = {
  CURRENT:          { color: "var(--color-navy)" },
  PREVIOUSLY_OWNED: { color: "var(--color-notes-text)" },
  WANT_TO_BUY:      { color: "var(--color-status-want)" },
  WANT_TO_SMELL:    { color: "var(--color-status-want)" },
  DONT_LIKE:        { color: "var(--color-destructive)" },
  WANT_TO_IDENTIFY: { color: "var(--color-accent-light)" },
  FINISHED:         { color: "var(--color-status-finished)" },
};

export function StatusBadge({ status }: { status: FragranceStatus }) {
  const style = STATUS_STYLE[status] ?? { color: "var(--color-notes-text)" };
  return (
    <span
      className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-sm)] px-2 py-[2px] whitespace-nowrap border"
      style={{ color: style.color, borderColor: style.color }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
