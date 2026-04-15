"use client";

import { Badge } from "@/components/ui/badge";
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

function concentrationLabel(type: string | null): string | null {
  if (!type) return null;
  const map: Record<string, string> = {
    "Extrait de Parfum": "EXTRAIT DE PARFUM",
    "Eau de Parfum": "EAU DE PARFUM",
    "Eau de Toilette": "EAU DE TOILETTE",
    "Perfume Oil": "OIL",
    "Cologne": "COLOGNE",
    "Body Spray": "BODY SPRAY",
    "Perfume Concentré": "CONCENTRÉ",
    "Other": "OTHER",
  };
  return map[type] ?? type.toUpperCase();
}

interface FragranceCardProps {
  frag: UserFragrance;
  compCount: number;
  accords: string[];
  addedDate: string | null;
  onClick: () => void;
}

export function FragranceCard({ frag, compCount, accords, addedDate, onClick }: FragranceCardProps) {
  const concLabel = concentrationLabel(frag.type ?? null);
  const ratingFilled = frag.personalRating ?? 0;
  const sizeDisplay = frag.sizes?.length ? frag.sizes.join(", ") : "—";
  const visibleAccords = accords.slice(0, 4);
  const extraAccords = accords.length > 4 ? accords.length - 4 : 0;

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--color-cream)",
        border: "1px solid var(--color-cream-dark)",
        borderRadius: "6px",
        padding: "16px",
        marginBottom: "8px",
        cursor: "pointer",
      }}
    >
      {/* Line 1: name + concentration badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "2px" }}>
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "18px",
            fontStyle: "italic",
            color: "var(--color-navy)",
            fontWeight: 400,
            flex: 1,
            minWidth: 0,
          }}
        >
          {frag.name}
        </span>
        {concLabel && (
          <span
            style={{
              border: "1px solid var(--color-sand)",
              color: "var(--color-sand)",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: "2px",
              textTransform: "uppercase",
              flexShrink: 0,
              alignSelf: "flex-start",
              marginTop: "2px",
            }}
          >
            {concLabel}
          </span>
        )}
        {frag.isDupe && (
          <span
            style={{
              background: "var(--color-sand-light)",
              color: "var(--color-navy)",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              fontWeight: 500,
              padding: "2px 6px",
              borderRadius: "2px",
              textTransform: "uppercase",
              flexShrink: 0,
              alignSelf: "flex-start",
              marginTop: "2px",
            }}
          >
            DUPE
          </span>
        )}
      </div>

      {/* Line 2: house */}
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "12px",
          fontWeight: 400,
          color: "var(--color-sand)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "10px",
        }}
      >
        {frag.house}
      </div>

      {/* Row: size · stars · added */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-navy)" }}>
          {sizeDisplay}
        </span>
        <span style={{ color: "var(--color-cream-dark)", fontSize: "12px" }}>·</span>
        <div style={{ display: "flex", gap: "1px" }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              style={{
                fontSize: "14px",
                color: ratingFilled >= s ? "var(--color-accent)" : "var(--color-cream-dark)",
              }}
            >
              ★
            </span>
          ))}
        </div>
        {addedDate && (
          <>
            <span style={{ color: "var(--color-cream-dark)", fontSize: "12px" }}>·</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-sand)" }}>
              {addedDate}
            </span>
          </>
        )}
      </div>

      {/* Accords */}
      {visibleAccords.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
          {visibleAccords.map((a) => (
            <span
              key={a}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 7px",
                borderRadius: "100px",
                background: "var(--color-sand-light)",
                color: "var(--color-navy)",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
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
                padding: "2px 7px",
                borderRadius: "100px",
                background: "var(--color-sand-light)",
                color: "var(--color-sand)",
                fontFamily: "var(--font-sans)",
                fontSize: "12px",
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
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: compCount > 0 ? "var(--color-navy)" : "var(--color-sand)" }}>
          {compCount > 0 ? compCount : "—"}
        </span>
      </div>
    </button>
  );
}
