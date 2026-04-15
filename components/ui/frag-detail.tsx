"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { starsStr, parseRating, getAccords, getCompCount } from "@/lib/frag-utils";
import { StatusBadge } from "@/components/ui/frag-row";
import { getCommunityData } from "@/lib/data";
import { submitCommunityFlag } from "@/lib/data/mutations";
import { useUser } from "@/lib/user-context";
import { useToast } from "@/components/ui/toast";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

const FLAG_FIELDS = [
  "Accords", "Top Notes", "Middle Notes", "Base Notes",
  "Avg Price", "Longevity", "Sillage", "Community Rating", "Other",
];

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--space-3)",
        padding: "var(--space-1) 0",
        borderBottom: "1px solid var(--color-border)",
      }}
      className="last:border-0"
    >
      <span
        className="text-label"
        style={{
          width: "110px",
          flexShrink: 0,
          color: "var(--color-text-muted)",
          paddingTop: "1px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function NoteChips({ raw }: { raw: string[] }) {
  if (!raw.length) return null;
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--space-1)",
        marginTop: "var(--space-1)",
      }}
    >
      {raw.map((n) => (
        <span
          key={n}
          style={{
            fontSize: "var(--text-xs)",
            padding: "var(--space-1) var(--space-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-secondary)",
            background: "var(--color-surface-raised)",
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  frag: UserFragrance | null;
  communityFrags: CommunityFrag[];
  compliments: UserCompliment[];
  userId: string;
  onEdit?: (frag: UserFragrance) => void;
  onDelete?: (frag: UserFragrance) => void;
  readOnly?: boolean;
}

export function FragDetail({
  open,
  onClose,
  frag,
  communityFrags,
  compliments,
  userId,
  onEdit,
  onDelete,
  readOnly = false,
}: Props) {
  const { user } = useUser();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagField, setFlagField] = useState(FLAG_FIELDS[0]);
  const [flagNote, setFlagNote] = useState("");
  const [flagging, setFlagging] = useState(false);

  if (!frag) return null;

  const cd = getCommunityData(frag.name, frag.house, communityFrags);
  const accords = getAccords(frag, communityFrags);
  const compCount = getCompCount(frag.fragranceId || frag.id, compliments, userId);
  const starsDisplay = starsStr(parseRating(frag.personalRating));
  const purchaseStr = [frag.purchaseMonth, frag.purchaseYear].filter(Boolean).join(" ") || frag.purchaseDate || null;

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.(frag!);
  }

  async function submitFlag() {
    if (!user || !frag) return;
    setFlagging(true);
    try {
      await submitCommunityFlag({
        userId: user.id,
        fragranceId: frag.fragranceId,
        fragranceName: frag.name,
        fragranceHouse: frag.house,
        fieldFlagged: flagField,
        userNote: flagNote,
      });
      toast("Flag submitted. Thanks!");
      setFlagOpen(false);
      setFlagNote("");
      setFlagField(FLAG_FIELDS[0]);
    } catch {
      toast("Failed to submit flag.");
    } finally {
      setFlagging(false);
    }
  }

  function handleClose() {
    setConfirmDelete(false);
    setFlagOpen(false);
    setFlagNote("");
    onClose();
  }

  const sectionLabel: React.CSSProperties = {
    fontSize: "var(--text-xs)",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--color-text-muted)",
    marginBottom: "var(--space-2)",
  };

  return (
    <Modal open={open} onClose={handleClose} className="max-w-[600px]">
      <ModalHeader title={frag.name} onClose={handleClose} />
      <ModalBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {frag.house && (
            <div style={{ fontSize: "var(--text-xs)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-secondary)", fontWeight: 500 }}>
              {frag.house}
            </div>
          )}

          {/* Status + accords header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <StatusBadge status={frag.status} />
              {frag.isDupe && frag.dupeFor && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Dupe for {frag.dupeFor}
                </span>
              )}
            </div>
            {compCount > 0 && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", fontWeight: 500 }}>
                {compCount} {compCount === 1 ? "compliment" : "compliments"}
              </span>
            )}
          </div>

          {/* Personal section */}
          <div>
            <div style={sectionLabel}>Personal</div>
            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "0 var(--space-3)",
              }}
            >
              {frag.personalRating ? (
                <div
                  style={{
                    display: "flex",
                    gap: "var(--space-3)",
                    padding: "var(--space-1) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    className="text-label"
                    style={{ width: "110px", flexShrink: 0, color: "var(--color-text-muted)" }}
                  >
                    Rating
                  </span>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", letterSpacing: "1px" }}>
                    {starsDisplay}
                  </span>
                </div>
              ) : null}
              <DetailRow label="Type" value={frag.type} />
              <DetailRow label="Sizes" value={(frag.sizes ?? []).join(", ") || null} />
              <DetailRow label="Bought from" value={frag.whereBought} />
              <DetailRow label="Purchase date" value={purchaseStr} />
              <DetailRow label="Price" value={frag.purchasePrice} />
            </div>
          </div>

          {/* Personal notes */}
          {frag.personalNotes && (
            <div>
              <div style={sectionLabel}>Notes</div>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--color-text-secondary)",
                  lineHeight: "var(--leading-normal)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {frag.personalNotes}
              </p>
            </div>
          )}

          {/* Community section */}
          {(cd || accords.length > 0) && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "var(--space-2)",
                }}
              >
                <div style={sectionLabel}>Community</div>
                <button
                  onClick={() => setFlagOpen((v) => !v)}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-muted)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "color var(--transition-fast)",
                  }}
                  className="hover:text-[var(--color-danger)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {flagOpen ? "Cancel flag" : "Flag incorrect data"}
                </button>
              </div>

              {flagOpen && (
                <div
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface-raised)",
                    padding: "var(--space-3)",
                    marginBottom: "var(--space-3)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                    Which field is incorrect?
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                    {FLAG_FIELDS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFlagField(f)}
                        style={{
                          fontSize: "var(--text-xs)",
                          padding: "var(--space-1) var(--space-2)",
                          border: "1px solid",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          transition: "background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)",
                          background: flagField === f ? "var(--color-accent)" : "transparent",
                          borderColor: flagField === f ? "var(--color-accent)" : "var(--color-border)",
                          color: flagField === f ? "var(--color-text-inverse)" : "var(--color-text-secondary)",
                        }}
                        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={flagNote}
                    onChange={(e) => setFlagNote(e.target.value)}
                    placeholder="What's wrong? (optional)"
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "var(--space-2) var(--space-3)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-surface)",
                      fontSize: "var(--text-sm)",
                      color: "var(--color-text-primary)",
                      resize: "none",
                      outline: "none",
                    }}
                    className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={submitFlag}
                    disabled={flagging}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {flagging ? "Submitting..." : "Submit flag"}
                  </Button>
                </div>
              )}

              <div
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0 var(--space-3)",
                }}
              >
                <DetailRow label="Avg price" value={cd?.avgPrice?.replace(/~/g, "") ?? null} />
                <DetailRow label="Community rating" value={cd?.communityRating ? `${cd.communityRating}${cd.ratingVoteCount ? ` (${cd.ratingVoteCount} votes)` : ""}` : null} />
                <DetailRow label="Parfumo rating" value={cd?.parfumoRating || null} />
                <DetailRow label="Longevity" value={cd?.communityLongevityLabel || null} />
                <DetailRow label="Sillage" value={cd?.communitySillageLabel || null} />
              </div>
              {accords.length > 0 && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ ...sectionLabel, marginBottom: "var(--space-1)" }}>Accords</div>
                  <NoteChips raw={accords} />
                </div>
              )}
              {cd?.topNotes && cd.topNotes.length > 0 && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ ...sectionLabel, marginBottom: "var(--space-1)" }}>Top Notes</div>
                  <NoteChips raw={cd.topNotes} />
                </div>
              )}
              {cd?.middleNotes && cd.middleNotes.length > 0 && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ ...sectionLabel, marginBottom: "var(--space-1)" }}>Middle Notes</div>
                  <NoteChips raw={cd.middleNotes} />
                </div>
              )}
              {cd?.baseNotes && cd.baseNotes.length > 0 && (
                <div style={{ marginTop: "var(--space-3)" }}>
                  <div style={{ ...sectionLabel, marginBottom: "var(--space-1)" }}>Base Notes</div>
                  <NoteChips raw={cd.baseNotes} />
                </div>
              )}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {!readOnly && onDelete && !confirmDelete && (
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
            {!readOnly && onDelete && confirmDelete && (
              <>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>
                  Remove permanently?
                </span>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {!readOnly && onEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { handleClose(); onEdit(frag!); }}
              >
                Edit
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
