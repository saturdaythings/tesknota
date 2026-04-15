"use client";

import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, FragranceStatus } from "@/types";

function statusVariant(
  status: FragranceStatus,
): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "CURRENT":
      return "collection";
    case "WANT_TO_BUY":
    case "WANT_TO_SMELL":
      return "wishlist";
    case "WANT_TO_IDENTIFY":
      return "identify_later";
    case "PREVIOUSLY_OWNED":
      return "previously_owned";
    case "DONT_LIKE":
      return "dont_like";
    case "FINISHED":
      return "finished";
    default:
      return "neutral";
  }
}

interface FragranceCardProps {
  frag: UserFragrance;
  compCount: number;
  onClick: () => void;
}

export function FragranceCard({ frag, compCount, onClick }: FragranceCardProps) {
  const ratingDisplay =
    frag.personalRating !== null
      ? `★ ${frag.personalRating.toFixed(1)}`
      : "★ —";

  const sizeDisplay =
    frag.sizes && frag.sizes.length > 0 ? frag.sizes.join(", ") : "—";

  const typeDisplay = frag.type ?? "—";

  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-sm)",
        cursor: "pointer",
        transition:
          "box-shadow var(--transition-base), border-color var(--transition-base)",
      }}
      className="hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
    >
      {/* Top row: name + badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "var(--space-3)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            className="text-subheading"
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {frag.name}
          </div>
          <div
            className="text-secondary"
            style={{ marginTop: "var(--space-1)" }}
          >
            {frag.house}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <Badge variant={statusVariant(frag.status)}>
            {STATUS_LABELS[frag.status]}
          </Badge>
        </div>
      </div>

      {/* Middle row: rating, size, type */}
      <div
        style={{
          marginTop: "var(--space-3)",
          display: "flex",
          gap: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { label: "Rating", value: ratingDisplay },
            { label: "Size", value: sizeDisplay },
            { label: "Type", value: typeDisplay },
          ] as const
        ).map(({ label, value }) => (
          <div key={label} style={{ minWidth: 0, flex: "1 1 0" }}>
            <div className="text-label">{label}</div>
            <div className="text-body">{value}</div>
          </div>
        ))}
      </div>

      {/* Bottom row: compliments + price */}
      <div
        style={{
          marginTop: "var(--space-3)",
          paddingTop: "var(--space-3)",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="text-meta"
          style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}
        >
          <MessageCircle size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
          {compCount} compliment{compCount !== 1 ? "s" : ""}
        </span>
        {frag.purchasePrice && (
          <span className="text-meta">{frag.purchasePrice}</span>
        )}
      </div>
    </button>
  );
}
