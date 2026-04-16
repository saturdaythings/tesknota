"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { Skeleton } from "@/components/ui/skeleton";
import { CompForm } from "@/components/ui/comp-form";
import { useData } from "@/lib/data-context";
import { MONTHS } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag, FragranceStatus } from "@/types";

// ── Constants ─────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "CURRENT", label: "Current Collection" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "WANT_TO_IDENTIFY", label: "Identify Later" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "DONT_LIKE", label: "Don't Like" },
  { value: "FINISHED", label: "Finished" },
];

const RATING_LABELS: Record<number, string> = {
  5: "LOVE",
  4: "REALLY LIKE",
  3: "LIKE",
  2: "OKAY",
  1: "SKIP",
};

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

function concentrationBadge(type: string | null) {
  if (!type) return null;
  const short: Record<string, string> = {
    "Extrait de Parfum": "EXTRAIT DE PARFUM",
    "Eau de Parfum": "EAU DE PARFUM",
    "Eau de Toilette": "EAU DE TOILETTE",
    "Perfume Oil": "OIL",
    "Cologne": "COLOGNE",
    "Body Spray": "BODY SPRAY",
    "Perfume Concentré": "CONCENTRÉ",
    "Other": "OTHER",
  };
  return short[type] ?? type.toUpperCase();
}

// ── Star rating (20px for panel) ──────────────────────────

function StarRating({
  value,
  onChange,
  size = 20,
}: {
  value: number | null;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const filled = hover ?? value ?? 0;

  return (
    <div role="group" aria-label="Personal rating" style={{ display: "flex", gap: "3px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            width: `${size}px`,
            height: `${size}px`,
            fontSize: `${size}px`,
            lineHeight: 1,
            color: filled >= star ? "var(--color-accent)" : "var(--color-cream-dark)",
            transition: "color 120ms",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Accord tag ────────────────────────────────────────────

function AccordTag({ label }: { label: string }) {
  return (
    <span
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
      {label}
    </span>
  );
}

// ── Section label ─────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "var(--color-navy)",
        marginBottom: "var(--space-2)",
      }}
    >
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────

const normStr = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

interface Props {
  frag: UserFragrance | null;
  open: boolean;
  onClose: () => void;
  communityFrags: CommunityFrag[];
  compliments: UserCompliment[];
  userId: string;
  onEdit: (frag: UserFragrance) => void;
  onDelete: (frag: UserFragrance) => void;
}

export function FragranceDetailModal({
  frag,
  open,
  onClose,
  communityFrags,
  compliments,
  userId,
  onEdit,
  onDelete,
}: Props) {
  const { editFrag } = useData();
  const router = useRouter();

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [compFormOpen, setCompFormOpen] = useState(false);
  const [statusDropOpen, setStatusDropOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mobile drag-to-dismiss
  function onTouchStart(e: React.TouchEvent) {
    setTouchStart(e.touches[0].clientY);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart === null) return;
    const delta = e.changedTouches[0].clientY - touchStart;
    if (delta > 80) handleClose();
    setTouchStart(null);
  }

  const cd = useMemo(() => {
    if (!frag) return null;
    return communityFrags.find(
      (c) =>
        (frag.fragranceId && c.fragranceId === frag.fragranceId) ||
        (normStr(c.fragranceName) === normStr(frag.name) &&
          normStr(c.fragranceHouse) === normStr(frag.house ?? "")),
    ) ?? null;
  }, [frag, communityFrags]);

  const fragCompliments = useMemo(() => {
    if (!frag) return [];
    const key = frag.fragranceId ?? frag.id;
    return compliments
      .filter((c) => c.primaryFragId === key || c.secondaryFragId === key)
      .sort(
        (a, b) =>
          parseInt(b.year || "0") * 100 + (parseInt(b.month || "0") || 0) -
          (parseInt(a.year || "0") * 100 + (parseInt(a.month || "0") || 0)),
      );
  }, [frag, compliments]);

  const compCount = fragCompliments.length;
  const recentCompliments = fragCompliments.slice(0, 3);

  const handleClose = useCallback(() => {
    setConfirmRemove(false);
    setEditingNotes(false);
    setStatusDropOpen(false);
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleStatusChange(status: string) {
    if (!frag) return;
    await editFrag({ ...frag, status: status as FragranceStatus });
    setStatusDropOpen(false);
  }

  async function handleRatingChange(rating: number) {
    if (!frag) return;
    await editFrag({ ...frag, personalRating: rating });
  }

  async function handleSaveNotes() {
    if (!frag) return;
    setSavingNotes(true);
    try {
      await editFrag({ ...frag, personalNotes: notesValue });
      setEditingNotes(false);
    } finally {
      setSavingNotes(false);
    }
  }

  if (!open) return null;

  const dateAdded = frag?.createdAt
    ? (() => {
        const d = new Date(frag.createdAt);
        return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : null;

  const purchaseDateStr = frag
    ? [frag.purchaseMonth, frag.purchaseYear].filter(Boolean).join(" ") || frag.purchaseDate || null
    : null;

  const accords = cd?.fragranceAccords ?? [];
  const concLabel = concentrationBadge(frag?.type ?? null);

  const sizeDisplay = frag?.sizes?.length
    ? frag.sizes.join(", ")
    : null;

  const rating = frag?.personalRating ?? null;
  const ratingLabel = rating ? RATING_LABELS[rating] : null;

  return (
    <>
      <CompForm
        open={compFormOpen}
        onClose={() => setCompFormOpen(false)}
        editing={null}
        prefillFragId={frag?.fragranceId ?? frag?.id}
      />

      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(30, 45, 69, 0.4)",
          zIndex: 250,
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={frag?.name ?? "Fragrance details"}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: "fixed",
          zIndex: 251,
          background: "var(--color-cream)",
          display: "flex",
          flexDirection: "column",
          // Desktop: right panel
          top: 0,
          right: 0,
          bottom: 0,
          width: "380px",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.15)",
          // Mobile overrides via class
        }}
        className="max-sm:w-full max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:h-[90vh] max-sm:rounded-t-[12px]"
      >
        {/* Mobile drag handle */}
        <div
          className="sm:hidden"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px 0 4px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "var(--color-cream-dark)",
            }}
          />
        </div>

        {/* Panel header */}
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--color-cream-dark)",
            flexShrink: 0,
          }}
        >
          {!frag ? (
            <Skeleton className="h-6 w-3/4" />
          ) : (
            <>
              {/* Row 1: name + badge + close */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", marginBottom: "4px" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "24px",
                    fontStyle: "italic",
                    color: "var(--color-navy)",
                    fontWeight: 400,
                    lineHeight: 1.2,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {frag.name}
                </h2>
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
                <button
                  onClick={handleClose}
                  aria-label="Close panel"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-sand)",
                    padding: "2px",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Row 2: house */}
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-sand)",
                  marginBottom: "8px",
                }}
              >
                {frag.house}
              </div>

              {/* Row 3: status + change link */}
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", position: "relative" }}>
                <Badge variant={statusVariant(frag.status)}>
                  {STATUS_LABELS[frag.status]}
                </Badge>
                <button
                  onClick={() => setStatusDropOpen((v) => !v)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-sand)",
                    padding: 0,
                  }}
                >
                  CHANGE STATUS
                </button>
                {statusDropOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      zIndex: 10,
                      width: "200px",
                    }}
                  >
                    <Select
                      options={STATUS_OPTIONS}
                      value={frag.status}
                      onChange={handleStatusChange}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4) var(--space-5)" }}>
          {!frag ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

              {/* MY RATING */}
              <section>
                <SectionLabel>My Rating</SectionLabel>
                <StarRating value={rating} onChange={handleRatingChange} size={20} />
                {ratingLabel && (
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "13px",
                      fontWeight: 400,
                      color: "var(--color-sand)",
                      marginTop: "4px",
                    }}
                  >
                    {ratingLabel}
                  </div>
                )}
              </section>

              <Divider style={{ margin: 0 }} />

              {/* SIZE + TYPE */}
              <section>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                  <div>
                    <SectionLabel>Size Owned</SectionLabel>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--color-navy)" }}>
                      {sizeDisplay ?? "—"}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Type</SectionLabel>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 600, color: "var(--color-navy)" }}>
                      {frag.type ?? "—"}
                    </div>
                  </div>
                </div>
              </section>

              <Divider style={{ margin: 0 }} />

              {/* FRAGRANCE PROFILE */}
              <section>
                <SectionLabel>Fragrance Profile</SectionLabel>

                {cd?.avgPrice && (
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "2px" }}>
                      Avg Price
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--color-navy)" }}>
                      {cd.avgPrice}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {(cd?.topNotes?.length || cd?.middleNotes?.length || cd?.baseNotes?.length) ? (
                  <div style={{ marginBottom: "var(--space-3)" }}>
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
                  </div>
                ) : null}

                {accords.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {accords.map((a) => <AccordTag key={a} label={a} />)}
                  </div>
                )}
              </section>

              <Divider style={{ margin: 0 }} />

              {/* MY PURCHASE */}
              <section>
                <SectionLabel>My Purchase</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "2px" }}>
                      Purchase Price
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--color-navy)" }}>
                      {frag.purchasePrice ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)", marginBottom: "2px" }}>
                      Where Bought
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--color-navy)" }}>
                      {frag.whereBought ? (
                        frag.whereBought.startsWith("http") ? (
                          <a href={frag.whereBought} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline" }}>
                            {frag.whereBought}
                          </a>
                        ) : (
                          frag.whereBought
                        )
                      ) : "—"}
                    </div>
                  </div>
                </div>
                {dateAdded && (
                  <div>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-sand)" }}>
                      Added
                    </span>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--color-sand)", marginLeft: "8px" }}>
                      {dateAdded}
                    </span>
                  </div>
                )}
              </section>

              {/* DUPE INFO */}
              {frag.isDupe && frag.dupeFor && (
                <>
                  <Divider style={{ margin: 0 }} />
                  <section>
                    <SectionLabel>Dupe Info</SectionLabel>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: "15px", fontStyle: "italic", color: "var(--color-accent)" }}>
                      Dupe for: {frag.dupeFor}
                    </div>
                  </section>
                </>
              )}

              <Divider style={{ margin: 0 }} />

              {/* PERSONAL NOTES */}
              <section>
                <SectionLabel>Personal Notes</SectionLabel>
                {editingNotes ? (
                  <div>
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      onBlur={handleSaveNotes}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveNotes(); } }}
                      rows={4}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "var(--color-cream)",
                        border: "1.5px solid var(--color-accent)",
                        borderRadius: "var(--radius-sm)",
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        fontSize: "15px",
                        color: "var(--color-sand)",
                        resize: "vertical",
                        outline: "none",
                      }}
                    />
                    {savingNotes && (
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-sand)", marginTop: "4px" }}>
                        Saving...
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => { setNotesValue(frag.personalNotes ?? ""); setEditingNotes(true); }}
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontStyle: "italic",
                      fontSize: "15px",
                      color: "var(--color-sand)",
                      cursor: "text",
                      minHeight: "32px",
                    }}
                  >
                    {frag.personalNotes?.trim() || "No personal notes yet."}
                  </div>
                )}
              </section>

              <Divider style={{ margin: 0 }} />

              {/* COMPLIMENTS */}
              <section>
                <SectionLabel>
                  Compliments ({compCount} total)
                </SectionLabel>

                {compCount === 0 ? (
                  <div style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: "14px", color: "var(--color-sand)" }}>
                    None logged
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                    {recentCompliments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          padding: "8px 10px",
                          background: "var(--color-cream-dark)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-navy)" }}>
                          {[c.relation, c.gender, c.city ?? c.country].filter(Boolean).join(" · ")}
                          {(c.month || c.year) && (
                            <span style={{ color: "var(--color-sand)", marginLeft: "6px" }}>
                              {[c.month, c.year].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </div>
                        {c.notes && (
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--color-sand)", marginTop: "2px" }}>
                            {c.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-2)" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/compliments?fragId=${encodeURIComponent(frag.fragranceId ?? frag.id)}`)}
                  >
                    View All Compliments
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCompFormOpen(true)}
                  >
                    Log New Compliment
                  </Button>
                </div>
              </section>

              {/* bottom padding so footer doesn't cover content */}
              <div style={{ height: "var(--space-4)" }} />
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            padding: "var(--space-3) var(--space-5) var(--space-8)",
            borderTop: "1px solid var(--color-cream-dark)",
            background: "var(--color-cream)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { handleClose(); if (frag) onEdit(frag); }}
          >
            Edit
          </Button>

          {confirmRemove ? (
            <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--color-sand)" }}>
                Are you sure?
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => { if (frag) { onDelete(frag); handleClose(); } }}
              >
                Yes, Remove
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmRemove(true)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
