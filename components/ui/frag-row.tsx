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
      className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-sm)] px-2 py-[2px] whitespace-nowrap border"
      style={{ color: style.color, borderColor: style.color }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/* component-internal: grid column widths for 7-col row + optional action col */
const GRID_BASE = "minmax(200px,1fr) 100px 80px 100px minmax(100px,1fr) 60px 130px";
const GRID_WITH_ACTION = GRID_BASE + " 120px";

const cellStyle: React.CSSProperties = {
  padding: "0 var(--space-4)",
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-xs)",
  color: "var(--color-navy)",
};

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
    <div
      style={{
        display: "grid",
        gridTemplateColumns: onAction ? GRID_WITH_ACTION : GRID_BASE,
        minHeight: "var(--size-row-min)",
        borderBottom: "1px solid var(--color-row-divider)",
        cursor: "pointer",
      }}
      className="hover:bg-[var(--color-row-hover)] transition-colors duration-100"
      onClick={() => onClick?.(frag)}
    >
      <div style={cellStyle}>
        <FragranceCell name={frag.name} house={frag.house} type={frag.type} isDupe={frag.isDupe} />
      </div>
      <div style={cellStyle}>
        {(frag.sizes ?? []).join(", ") || "\u2014"}
      </div>
      <div style={{ ...cellStyle, color: "var(--color-accent)", letterSpacing: "1px" }}>
        {starsStr(parseRating(frag.personalRating))}
      </div>
      <div style={cellStyle}>{addedStr || "\u2014"}</div>
      <div style={cellStyle}>{accords}</div>
      <div style={cellStyle}>
        {compCount > 0 ? <span style={{ color: "var(--color-accent)" }}>{compCount}</span> : "\u2014"}
      </div>
      <div style={{ ...cellStyle, justifyContent: "flex-start" }}>
        <StatusBadge status={frag.status} />
      </div>
      {onAction && (
        <div style={cellStyle}>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(frag, e); }}
            className="font-[var(--font-sans)] text-xs tracking-[0.06em] px-3 py-[4px] border border-[var(--color-cream-dark)] text-[var(--color-navy)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors whitespace-nowrap"
          >
            {actionLabel ?? "Action"}
          </button>
        </div>
      )}
    </div>
  );
}
