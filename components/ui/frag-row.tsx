"use client";

import { MONTHS, starsStr, parseRating, getAccords, getCompCount } from "@/lib/frag-utils";
import { STATUS_LABELS, type FragranceType } from "@/types";

const TYPE_ABBR: Record<FragranceType, string> = {
  "Extrait de Parfum":  "Extrait",
  "Eau de Parfum":      "EDP",
  "Eau de Toilette":    "EDT",
  "Cologne":            "EDC",
  "Perfume Concentré":  "Concentré",
  "Body Spray":         "Spray",
  "Perfume Oil":        "Oil",
  "Other":              "",
};
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

export function StatusBadge({ status }: { status: FragranceStatus }) {
  const style = STATUS_STYLE[status] ?? { text: "var(--color-text-secondary)", bg: "transparent" };
  return (
    <span
      style={{
        color: style.text,
        background: style.bg,
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        letterSpacing: "0.04em",
        padding: "2px var(--space-2)",
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
      }}
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
      style={{
        borderBottom: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background var(--transition-fast)",
      }}
      className="last:border-0 hover:bg-[var(--color-surface-raised)]"
      onClick={() => onClick?.(frag)}
    >
      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
        <div
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-primary)",
            fontWeight: 500,
          }}
        >
          {frag.name}
          {frag.isDupe && (
            <span
              style={{
                marginLeft: "var(--space-2)",
                fontSize: "var(--text-xs)",
                letterSpacing: "0.06em",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                verticalAlign: "middle",
              }}
            >
              dupe
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-text-secondary)",
            marginTop: "var(--space-1)",
          }}
        >
          {frag.house}
          {frag.type && TYPE_ABBR[frag.type] && (
            <span style={{ marginLeft: "var(--space-1)", color: "var(--color-text-muted)" }}>
              · {TYPE_ABBR[frag.type]}
            </span>
          )}
        </div>
      </td>
      <td
        style={{
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
        }}
      >
        {(frag.sizes ?? []).join(", ") || "\u2014"}
      </td>
      <td
        style={{
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-accent)",
          letterSpacing: "1px",
        }}
      >
        {starsStr(parseRating(frag.personalRating))}
      </td>
      <td
        style={{
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
        }}
      >
        {addedStr || "\u2014"}
      </td>
      <td
        style={{
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
        }}
      >
        {accords}
      </td>
      <td
        style={{
          padding: "var(--space-3) var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
        }}
      >
        {compCount > 0 ? (
          <span style={{ color: "var(--color-accent)" }}>{compCount}</span>
        ) : (
          "\u2014"
        )}
      </td>
      <td style={{ padding: "var(--space-3) var(--space-4)" }}>
        <StatusBadge status={frag.status} />
      </td>
      {onAction && (
        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAction(frag, e); }}
            style={{
              fontSize: "var(--text-xs)",
              letterSpacing: "0.04em",
              padding: "var(--space-1) var(--space-3)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--color-text-secondary)",
              background: "transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "border-color var(--transition-fast), color var(--transition-fast)",
            }}
            className="hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            {actionLabel ?? "Action"}
          </button>
        </td>
      )}
    </tr>
  );
}
