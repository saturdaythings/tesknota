"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shortFragType } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, FragranceStatus } from "@/types";

function statusVariant(status: FragranceStatus): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "CURRENT": return "collection";
    case "WANT_TO_BUY": case "WANT_TO_SMELL": return "wishlist";
    case "WANT_TO_IDENTIFY": return "identify_later";
    case "PREVIOUSLY_OWNED": return "previously_owned";
    case "DONT_LIKE": return "dont_like";
    case "FINISHED": return "finished";
    default: return "neutral";
  }
}


interface FragranceCardProps {
  frag: UserFragrance;
  compCount: number;
  accords: string[];
  addedDate: string | null;
  onClick: () => void;
}

export function FragranceCard({ frag, compCount, accords, addedDate, onClick }: FragranceCardProps) {
  const concLabel = shortFragType(frag.type ?? null);
  const ratingFilled = frag.personalRating ?? 0;
  const sizeDisplay = frag.sizes?.length ? frag.sizes.join(", ") : "—";
  const visibleAccords = accords.slice(0, 4);
  const extraAccords = accords.length > 4 ? accords.length - 4 : 0;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className="!block w-full h-auto text-left"
      style={{
        background: "var(--color-cream)",
        border: "1px solid var(--color-cream-dark)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        marginBottom: "var(--space-2)",
      }}
    >
      {/* Line 1: name + concentration badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-half)" }}>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-note)",
            fontStyle: "italic",
            color: "var(--color-navy)",
            fontWeight: 400,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {frag.name}
        </span>
        {concLabel && (
          <span
            style={{
              background: "var(--color-cream-dark)",
              border: "1px solid var(--color-row-divider)",
              borderRadius: "var(--radius-full)",
              padding: "var(--space-half) var(--space-2)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-label)",
              color: "var(--color-meta-text)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {concLabel}
          </span>
        )}
        {frag.isDupe && (
          <span
            style={{
              background: "var(--color-cream-dark)",
              border: "1px solid var(--color-navy)",
              borderRadius: "var(--radius-full)",
              padding: "var(--space-half) var(--space-2)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-label)",
              color: "var(--color-navy)",
              letterSpacing: "var(--tracking-wide)",
              textTransform: "uppercase",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Dupe
          </span>
        )}
      </div>

      {/* Line 2: house */}
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-label)",
          fontWeight: 400,
          color: "var(--color-meta-text)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-wide)",
          marginBottom: frag.isDupe && frag.dupeFor ? "var(--space-half)" : "var(--space-3)",
        }}
      >
        {frag.house}
      </div>
      {frag.isDupe && frag.dupeFor && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", fontStyle: "italic", marginBottom: "var(--space-3)" }}>
          dupe of {frag.dupeFor}
        </div>
      )}

      {/* Row: size · stars · added */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
          {sizeDisplay}
        </span>
        <span style={{ color: "var(--color-cream-dark)", fontSize: "var(--text-xs)" }}>·</span>
        <div style={{ display: "flex", gap: "1px" }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              style={{
                fontSize: "var(--text-ui)",
                color: ratingFilled >= s ? "var(--color-accent)" : "var(--color-cream-dark)",
              }}
            >
              ★
            </span>
          ))}
        </div>
        {addedDate && (
          <>
            <span style={{ color: "var(--color-cream-dark)", fontSize: "var(--text-xs)" }}>·</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-navy)" }}>
              {addedDate}
            </span>
          </>
        )}
      </div>

      {/* Accords */}
      {visibleAccords.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-3)" }}>
          {visibleAccords.map((a) => (
            <span
              key={a}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "var(--space-half) var(--space-2)",
                borderRadius: "var(--radius-full)",
                background: "var(--color-sand-light)",
                color: "var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xs)",
                fontWeight: 400,
              }}
            >
              {a}
            </span>
          ))}
          {extraAccords > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "var(--space-half) var(--space-2)",
                borderRadius: "var(--radius-full)",
                background: "var(--color-sand-light)",
                color: "var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xs)",
              }}
            >
              +{extraAccords} more
            </span>
          )}
        </div>
      )}

      {/* Bottom row: status badge + compliment count */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Badge variant={statusVariant(frag.status)}>
          {STATUS_LABELS[frag.status]}
        </Badge>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: compCount > 0 ? "var(--color-navy)" : "var(--color-cream-dark)" }}>
          {compCount > 0 ? compCount : "—"}
        </span>
      </div>
    </Button>
  );
}
