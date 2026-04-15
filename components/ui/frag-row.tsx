"use client";

import { MONTHS, starsStr, parseRating, getAccords, getCompCount } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag, FragranceStatus } from "@/types";

// Status badge: colored pill with per-status color token
const STATUS_STYLE: Record<string, { text: string; bg: string }> = {
  CURRENT:          { text: "var(--s-cur)",  bg: "var(--s-cur-bg)" },
  PREVIOUSLY_OWNED: { text: "var(--s-prv)",  bg: "transparent" },
  WANT_TO_BUY:      { text: "var(--s-wnt)",  bg: "var(--s-wnt-bg)" },
  WANT_TO_SMELL:    { text: "var(--s-wnt)",  bg: "var(--s-wnt-bg)" },
  DONT_LIKE:        { text: "var(--s-no)",   bg: "var(--s-no-bg)" },
  WANT_TO_IDENTIFY: { text: "var(--s-unk)",  bg: "var(--s-unk-bg)" },
  FINISHED:         { text: "var(--s-fin)",  bg: "transparent" },
};

export function statusColorClass(status: FragranceStatus): string {
  return ""; // kept for backward compat — use StatusBadge instead
}

export function StatusBadge({ status }: { status: FragranceStatus }) {
  const style = STATUS_STYLE[status] ?? { text: "var(--ink3)", bg: "transparent" };
  return (
    <span
      className="font-[var(--mono)] text-xs tracking-[0.04em] px-2 py-[2px] whitespace-nowrap"
      style={{ color: style.text, background: style.bg }}
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
      className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer"
      onClick={() => onClick?.(frag)}
    >
      <td className="px-4 py-3">
        <div className="font-[var(--body)] text-sm text-[var(--ink)]">
          {frag.name}
          {frag.isDupe && (
            <span className="ml-2 text-xs bg-[var(--ink3)] text-[var(--off)] px-[4px] py-[1px] align-middle tracking-[0.04em]">
              DUPE
            </span>
          )}
        </div>
        <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{frag.house}</div>
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink2)]">
        {(frag.sizes ?? []).join(", ") || "\u2014"}
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--warm-text)] tracking-[1px]">
        {starsStr(parseRating(frag.personalRating))}
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
        {addedStr || "\u2014"}
      </td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">{accords}</td>
      <td className="px-4 py-3 font-[var(--mono)] text-xs text-[var(--ink3)]">
        {compCount > 0 ? <span className="text-[var(--blue)]">{compCount}</span> : "\u2014"}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={frag.status} />
      </td>
      {onAction && (
        <td className="px-4 py-3">
          <button
            onClick={(e) => { e.stopPropagation(); onAction(frag, e); }}
            className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[4px] border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors whitespace-nowrap"
          >
            {actionLabel ?? "Action"}
          </button>
        </td>
      )}
    </tr>
  );
}
