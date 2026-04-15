"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Divider } from "@/components/ui/divider";
import { Badge } from "@/components/ui/badge";
import { CompForm } from "@/components/ui/comp-form";
import { useData } from "@/lib/data-context";
import { MONTHS, getCompCount, parseRating } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import type { UserFragrance, UserCompliment, CommunityFrag, FragranceStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "CURRENT", label: "Current Collection" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "WANT_TO_IDENTIFY", label: "Identify Later" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "DONT_LIKE", label: "Don't Like" },
  { value: "FINISHED", label: "Finished" },
];

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

const normStr = (s: string) =>
  (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ── Star Rating ───────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const filled = hover ?? value ?? 0;

  return (
    <div
      role="group"
      aria-label="Personal rating"
      style={{ display: "flex", gap: "var(--space-1)" }}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            width: "22px",
            height: "22px",
            fontSize: "22px",
            lineHeight: 1,
            color: filled >= star ? "var(--color-accent)" : "var(--color-border-strong)",
            transition: "color var(--transition-fast)",
          }}
          className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="text-label" style={{ marginBottom: "2px" }}>
        {label}
      </div>
      <div
        className={value ? "text-body" : "text-meta"}
        style={{ color: value ? undefined : "var(--color-text-muted)" }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

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
  const [showAllNotes, setShowAllNotes] = useState(false);

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
      .filter((c) => c.primaryFragId === key)
      .sort(
        (a, b) =>
          parseInt(b.year || "0") * 100 +
          (parseInt(b.month || "0") || 0) -
          (parseInt(a.year || "0") * 100 + (parseInt(a.month || "0") || 0)),
      );
  }, [frag, compliments]);

  const compCount = fragCompliments.length;
  const recentCompliments = fragCompliments.slice(0, 3);

  const handleClose = useCallback(() => {
    setConfirmRemove(false);
    setEditingNotes(false);
    setShowAllNotes(false);
    onClose();
  }, [onClose]);

  async function handleStatusChange(status: string) {
    if (!frag) return;
    await editFrag({ ...frag, status: status as FragranceStatus });
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

  if (!frag) {
    return (
      <Modal open={open} onClose={handleClose}>
        <ModalHeader title="Fragrance" onClose={handleClose} />
        <ModalBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </ModalBody>
      </Modal>
    );
  }

  const accordsStr = cd?.fragranceAccords?.join(", ") || null;
  const notesAll = [
    cd?.topNotes?.length ? `Top: ${cd.topNotes.join(", ")}` : null,
    cd?.middleNotes?.length ? `Middle: ${cd.middleNotes.join(", ")}` : null,
    cd?.baseNotes?.length ? `Base: ${cd.baseNotes.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const notesDisplay = notesAll || accordsStr;

  const dateAdded = frag.createdAt
    ? (() => {
        const d = new Date(frag.createdAt);
        return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
      })()
    : null;

  const purchaseDateStr = [frag.purchaseMonth, frag.purchaseYear]
    .filter(Boolean)
    .join(" ") || frag.purchaseDate || null;

  return (
    <>
      <CompForm
        open={compFormOpen}
        onClose={() => setCompFormOpen(false)}
        editing={null}
        prefillFragId={frag.fragranceId ?? frag.id}
      />

      <Modal open={open} onClose={handleClose} className="max-w-[600px]">
        {/* Header */}
        <ModalHeader
          title={frag.name}
          onClose={handleClose}
        />

        {/* Sub-header with brand */}
        <div
          style={{
            padding: "var(--space-2) var(--space-6) 0",
          }}
        >
          <span className="text-secondary">{frag.house}</span>
        </div>

        <ModalBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

            {/* Section: Status & Ownership */}
            <section>
              <p className="text-label" style={{ marginBottom: "var(--space-3)" }}>
                Status &amp; Ownership
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <div className="text-label" style={{ marginBottom: "var(--space-1)" }}>
                    Status
                  </div>
                  <Select
                    options={STATUS_OPTIONS}
                    value={frag.status}
                    onChange={handleStatusChange}
                    className="max-w-[240px]"
                  />
                </div>

                <div>
                  <div className="text-label" style={{ marginBottom: "var(--space-2)" }}>
                    My Rating
                  </div>
                  <StarRating
                    value={frag.personalRating}
                    onChange={handleRatingChange}
                  />
                </div>

                <div
                  className="grid gap-[var(--space-4)] grid-cols-2 max-sm:grid-cols-1"
                >
                  <FieldRow
                    label="Size Owned"
                    value={frag.sizes?.length > 0 ? frag.sizes.join(", ") : null}
                  />
                  <FieldRow label="Type" value={frag.type} />
                </div>
              </div>
            </section>

            <Divider />

            {/* Section: Fragrance Profile */}
            <section>
              <p className="text-label" style={{ marginBottom: "var(--space-3)" }}>
                Fragrance Profile
              </p>
              <div className="grid gap-[var(--space-4)] grid-cols-2 max-sm:grid-cols-1">
                <FieldRow label="Fragrance Type" value={cd?.fragranceType} />
                <div>
                  <div className="text-label" style={{ marginBottom: "2px" }}>
                    Notes &amp; Accords
                  </div>
                  {notesDisplay ? (
                    <div>
                      <div
                        className="text-body"
                        style={{
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: showAllNotes ? undefined : 3,
                          WebkitBoxOrient: "vertical",
                        } as React.CSSProperties}
                      >
                        {notesDisplay}
                      </div>
                      {notesDisplay.length > 120 && (
                        <button
                          onClick={() => setShowAllNotes((v) => !v)}
                          className="text-meta"
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-accent)",
                            padding: 0,
                            marginTop: "2px",
                            fontSize: "var(--text-xs)",
                          }}
                        >
                          {showAllNotes ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-meta" style={{ color: "var(--color-text-muted)" }}>
                      —
                    </span>
                  )}
                </div>
                <FieldRow
                  label="Longevity"
                  value={cd?.communityLongevityLabel || cd?.parfumoLongevity}
                />
                <FieldRow
                  label="Sillage"
                  value={cd?.communitySillageLabel || cd?.parfumoSillage}
                />
                <FieldRow
                  label="Avg Price"
                  value={cd?.avgPrice}
                />
                <FieldRow
                  label="Community Rating"
                  value={
                    cd?.communityRating
                      ? parseFloat(cd.communityRating).toFixed(1)
                      : null
                  }
                />
              </div>
            </section>

            <Divider />

            {/* Section: My Purchase */}
            <section>
              <p className="text-label" style={{ marginBottom: "var(--space-3)" }}>
                My Purchase
              </p>
              <div className="grid gap-[var(--space-4)] grid-cols-2 max-sm:grid-cols-1">
                <FieldRow label="Purchase Price" value={frag.purchasePrice} />
                <FieldRow label="Where Bought" value={frag.whereBought} />
                <FieldRow label="Date Added" value={dateAdded} />
                {purchaseDateStr && (
                  <FieldRow label="Purchase Date" value={purchaseDateStr} />
                )}
              </div>
            </section>

            <Divider />

            {/* Section: Personal Notes */}
            <section>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "var(--space-3)",
                }}
              >
                <p className="text-label">Personal Notes</p>
                {!editingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Edit notes"
                    onClick={() => {
                      setNotesValue(frag.personalNotes ?? "");
                      setEditingNotes(true);
                    }}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </Button>
                )}
              </div>

              {editingNotes ? (
                <div>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: "var(--color-surface)",
                      border: "1.5px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-text-primary)",
                      resize: "vertical",
                      outline: "none",
                    }}
                    className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
                    autoFocus
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "var(--space-2)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className={frag.personalNotes?.trim() ? "text-body" : "text-meta"}
                  style={{ color: frag.personalNotes?.trim() ? undefined : "var(--color-text-muted)" }}
                >
                  {frag.personalNotes?.trim() || "No notes yet."}
                </p>
              )}
            </section>

            <Divider />

            {/* Section: Compliments */}
            <section>
              <p
                className="text-subheading"
                style={{ marginBottom: "var(--space-3)" }}
              >
                {compCount} total compliment{compCount !== 1 ? "s" : ""}
              </p>

              {recentCompliments.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                    marginBottom: "var(--space-4)",
                  }}
                >
                  {recentCompliments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "var(--space-3)",
                        background: "var(--color-surface-raised)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div
                        className="text-secondary"
                        style={{ marginBottom: "2px" }}
                      >
                        {[c.month, c.year].filter(Boolean).join(" ")}
                        {c.relation && ` · ${c.relation}`}
                        {c.location && ` · ${c.location}`}
                      </div>
                      {c.notes && (
                        <p className="text-secondary">{c.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/compliments?fragId=${encodeURIComponent(
                        frag.fragranceId ?? frag.id,
                      )}`,
                    )
                  }
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
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              handleClose();
              onEdit(frag);
            }}
          >
            Edit Details
          </Button>

          {confirmRemove ? (
            <>
              <span
                className="text-secondary"
                style={{ fontSize: "var(--text-sm)" }}
              >
                Are you sure?
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onDelete(frag);
                  handleClose();
                }}
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
            </>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 size={14} aria-hidden="true" />
              Remove
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </>
  );
}
