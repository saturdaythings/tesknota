"use client";

import { MONTHS, starsStr, parseRating, getAccords, getCompCount } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import { FragranceCell } from "@/components/ui/fragrance-cell";
import type { UserFragrance, UserCompliment, CommunityFrag, FragranceStatus } from "@/types";

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
      className="font-[var(--font-sans)] text-xs tracking-[0.04em] px-2 py-[2px] whitespace-nowrap border"
      style={{ color: style.color, borderColor: style.color }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function FragRow({
  frag,
  communityFrags,
  compliments,
  userId,
  onClick,
  actionLabel,
  onAction,
}: {
  frag: UserFragrance;
  communityFrags: CommunityFrag[];
  compliments: UserCompliment[];
  userId: string;
  onClick?: (frag: UserFragrance) => void;
  actionLabel?: string;
  onAction?: (frag: UserFragrance, e: React.MouseEvent) => void;
}) {
  const compCount = getCompCount(frag.fragranceId || frag.id, compliments, userId);
  const accords = getAccords(frag, communityFrags).slice(0, 3).join(", ") || "\u2014";
  const addedStr =
    frag.purchaseDate ??
    (frag.createdAt
      ? `${MONTHS[new Date(frag.createdAt).getMonth()]} ${new Date(frag.createdAt).getFullYear()}`
      : "");

  return (
    <tr
      className="border-b border-[var(--color-cream-dark)] last:border-0 hover:bg-[var(--color-cream-dark)] cursor-pointer"
      onClick={() => onClick?.(frag)}
    >
      <td className="px-4 py-3">
        <FragranceCell name={frag.name} house={frag.house} type={frag.type} />
        {frag.isDupe && (
          <span className="font-[var(--font-sans)] uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.06em', color: 'var(--color-notes-text)' }}>
            dupe
          </span>
        )}
      </td>
      <td className="px-4 py-3 font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
        {(frag.sizes ?? []).join(", ") || "\u2014"}
      </td>
      <td className="px-4 py-3 font-[var(--font-sans)] text-xs text-[var(--color-accent)] tracking-[1px]">
        {starsStr(parseRating(frag.personalRating))}
      </td>
      <td className="px-4 py-3 font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
        {addedStr || "\u2014"}
      </td>
      <td className="px-4 py-3 font-[var(--font-sans)] text-xs text-[var(--color-navy)]">{accords}</td>
      <td className="px-4 py-3 font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
        {compCount > 0 ? <span className="text-[var(--color-accent)]">{compCount}</span> : "\u2014"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={frag.status} />
      </td>
      {onAction && (
        <td className="px-4 py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(frag, e); }}
            className="font-[var(--font-sans)] text-xs tracking-[0.06em] px-3 py-[4px] border border-[var(--color-cream-dark)] text-[var(--color-navy)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors whitespace-nowrap"
          >
            {actionLabel ?? "Action"}
          </button>
        </td>
      )}
    </tr>
  );
}
