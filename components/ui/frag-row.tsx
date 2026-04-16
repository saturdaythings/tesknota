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

const STATUS_STYLE: Record<string, { color: string }> = {
  CURRENT:          { color: "var(--color-navy)" },
  PREVIOUSLY_OWNED: { color: "rgba(30,45,69,0.7)" },
  WANT_TO_BUY:      { color: "#8B6F4E" },
  WANT_TO_SMELL:    { color: "#8B6F4E" },
  DONT_LIKE:        { color: "var(--color-destructive)" },
  WANT_TO_IDENTIFY: { color: "var(--color-accent-light)" },
  FINISHED:         { color: "#6B7280" },
};

export function StatusBadge({ status }: { status: FragranceStatus }) {
  const style = STATUS_STYLE[status] ?? { color: "rgba(30,45,69,0.7)" };
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
        <div className="font-[var(--font-sans)] text-sm text-[var(--color-navy)]">
          {frag.name}
          {frag.isDupe && (
            <span className="ml-2 font-[var(--font-sans)] text-[12px] tracking-[0.06em] text-[rgba(30,45,69,0.7)] uppercase align-middle">
              dupe
            </span>
          )}
        </div>
        <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
          {frag.house}
          {frag.type && TYPE_ABBR[frag.type] && (
            <span className="ml-[6px] text-[11px]">· {TYPE_ABBR[frag.type]}</span>
          )}
        </div>
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
