"use client";

import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import type { UserFragrance, CommunityFrag, FragranceStatus } from "@/types";

const STATUS_LABELS: Record<FragranceStatus, string> = {
  CURRENT: "Current",
  PREVIOUSLY_OWNED: "Prev. Owned",
  WANT_TO_BUY: "Want to Buy",
  WANT_TO_SMELL: "Want to Smell",
  DONT_LIKE: "Don't Like",
  WANT_TO_IDENTIFY: "Identify Later",
  FINISHED: "Finished",
};

function statusVariant(status: FragranceStatus): React.ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "WANT_TO_BUY": case "WANT_TO_SMELL": return "wishlist";
    case "WANT_TO_IDENTIFY": return "identify_later";
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

const normStr = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: "var(--font-sans)",
      fontSize: "12px",
      fontWeight: 500,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--color-navy)",
      marginBottom: "var(--space-2)",
    }}>
      {children}
    </div>
  );
}

interface Props {
  frag: UserFragrance | null;
  open: boolean;
  onClose: () => void;
  communityFrags: CommunityFrag[];
  onAddToCollection: (frag: UserFragrance) => void;
  onRemove: (frag: UserFragrance) => void;
}

export function WishlistDetailPanel({ frag, open, onClose, communityFrags, onAddToCollection, onRemove }: Props) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleClose = useCallback(() => {
    setConfirmRemove(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function onTouchStart(e: React.TouchEvent) { setTouchStart(e.touches[0].clientY); }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    if (e.changedTouches[0].clientY - touchStart > 80) handleClose();
    setTouchStart(null);
  }

  if (!open) return null;

  const cd = frag
    ? communityFrags.find(
        (c) =>
          (frag.fragranceId && c.fragranceId === frag.fragranceId) ||
          (normStr(c.fragranceName) === normStr(frag.name) &&
            normStr(c.fragranceHouse) === normStr(frag.house ?? "")),
      ) ?? null
    : null;

  const accords = cd?.fragranceAccords ?? [];
  const concLabel = frag ? concentrationLabel(frag.type ?? null) : null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{ position: "fixed", inset: 0, background: "rgba(30,45,69,0.4)", zIndex: 200 }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={frag?.name ?? "Wishlist item"}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed",
          zIndex: 201,
          background: "var(--color-cream)",
          display: "flex",
          flexDirection: "column",
          top: 0,
          right: 0,
          bottom: 0,
          width: "360px",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.15)",
        }}
        className="max-sm:w-full max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:h-[85vh] max-sm:rounded-t-[12px]"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden" style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--color-cream-dark)" }} />
        </div>

        {/* Header */}
        {frag && (
          <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-cream-dark)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", marginBottom: "4px" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontStyle: "italic", color: "var(--color-navy)", fontWeight: 400, lineHeight: 1.2, flex: 1 }}>
                {frag.name}
              </h2>
              {concLabel && (
                <span style={{
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
                }}>
                  {concLabel}
                </span>
              )}
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-sand)", padding: "2px", flexShrink: 0, alignSelf: "flex-start" }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "8px" }}>
              {frag.house}
            </div>
            <Badge variant={statusVariant(frag.status)}>
              {STATUS_LABELS[frag.status]}
            </Badge>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4) var(--space-5)" }}>
          {frag && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

              {/* Avg price */}
              {cd?.avgPrice && (
                <section>
                  <SectionLabel>Avg Price</SectionLabel>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "20px", fontWeight: 600, color: "var(--color-navy)" }}>
                    {cd.avgPrice}
                  </div>
                </section>
              )}

              {/* Notes */}
              {(cd?.topNotes?.length || cd?.middleNotes?.length || cd?.baseNotes?.length) && (
                <>
                  <Divider style={{ margin: 0 }} />
                  <section>
                    <SectionLabel>Notes</SectionLabel>
                    {[
                      { label: "TOP", notes: cd?.topNotes },
                      { label: "HEART", notes: cd?.middleNotes },
                      { label: "BASE", notes: cd?.baseNotes },
                    ].map(({ label, notes }) =>
                      notes?.length ? (
                        <div key={label} style={{ marginBottom: "var(--space-2)" }}>
                          <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", color: "var(--color-sand)" }}>
                            {label}
                          </span>
                          <span style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontStyle: "italic", color: "var(--color-navy)", marginLeft: "8px" }}>
                            {notes.join(", ")}
                          </span>
                        </div>
                      ) : null,
                    )}
                  </section>
                </>
              )}

              {/* Accords */}
              {accords.length > 0 && (
                <>
                  <Divider style={{ margin: 0 }} />
                  <section>
                    <SectionLabel>Accords</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {accords.map((a) => (
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
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Community data */}
              {cd?.communityRating && (
                <>
                  <Divider style={{ margin: 0 }} />
                  <section>
                    <SectionLabel>Community</SectionLabel>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                      {cd.communityRating && (
                        <div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "2px" }}>Rating</div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--color-navy)" }}>{parseFloat(cd.communityRating).toFixed(1)} ★</div>
                        </div>
                      )}
                      {cd.communityLongevityLabel && (
                        <div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "2px" }}>Longevity</div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--color-navy)" }}>{cd.communityLongevityLabel}</div>
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "var(--space-3) var(--space-5)", borderTop: "1px solid var(--color-cream-dark)", background: "var(--color-cream)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { if (frag) { onAddToCollection(frag); handleClose(); } }}
              style={{ flex: 1 }}
            >
              Add to Collection
            </Button>

            {confirmRemove ? (
              <>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-sand)", alignSelf: "center" }}>
                  Remove?
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => { if (frag) { onRemove(frag); handleClose(); } }}
                >
                  Yes
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmRemove(true)}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
