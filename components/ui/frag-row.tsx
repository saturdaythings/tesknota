"use client";

import { MONTHS, starsStr, parseRating, getAccords, getCompCount } from "@/lib/frag-utils";
import { STATUS_LABELS, STATUS_CSS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag, FragranceStatus } from "@/types";
import type { UserId } from "@/lib/user-context";

export const STATUS_COLOR: Record<string, string> = {
  "s-cur": "text-[var(--sage)]",
  "s-prv": "text-[var(--ink3)]",
  "s-wnt": "text-[var(--s-want)]",
  "s-no": "text-[var(--rose-tk)]",
  "s-unk": "text-[var(--s-unknown)]",
  "s-fin": "text-[var(--s-sold)]",
};

export function statusColorClass(status: FragranceStatus): string {
  return STATUS_COLOR[STATUS_CSS[status]] ?? "text-[var(--ink3)]";
}

export function FragRow({
  frag,
  communityFrags,
  compliments,
  userId,
}: {
  frag: UserFragrance;
  communityFrags: CommunityFrag[];
  compliments: UserCompliment[];
  userId: UserId;
}) {
  const compCount = getCompCount(frag.fragranceId || frag.id, compliments, userId);
  const accords = getAccords(frag, communityFrags).slice(0, 3).join(", ") || "\u2014";
  const addedStr =
    frag.purchaseDate ??
    (frag.createdAt
      ? `${MONTHS[new Date(frag.createdAt).getMonth()]} ${new Date(frag.createdAt).getFullYear()}`
      : "");

  return (
    <tr className="border-b border-[var(--b1)] last:border-0 hover:bg-[var(--b1)] cursor-pointer">
      <td className="px-4 py-3">
        <div className="font-[var(--body)] text-sm text-[var(--ink)]">
          {frag.name}
          {frag.isDupe && (
            <span className="ml-2 text-[11px] bg-[var(--ink3)] text-[var(--off)] px-[4px] py-[1px] align-middle tracking-[0.04em]">
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
        <span className={`font-[var(--mono)] text-[11px] tracking-[0.04em] ${statusColorClass(frag.status)}`}>
          {STATUS_LABELS[frag.status] ?? frag.status}
        </span>
      </td>
    </tr>
  );
}
