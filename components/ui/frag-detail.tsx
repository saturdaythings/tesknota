"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
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
    <div className="flex gap-3 py-[5px] border-b border-[var(--color-cream-dark)] last:border-0">
      <span className="w-[110px] shrink-0 font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase text-[var(--color-navy)]">
        {label}
      </span>
      <span className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">{value}</span>
    </div>
  );
}

function NoteChips({ raw }: { raw: string[] }) {
  if (!raw.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {raw.map((n) => (
        <span
          key={n}
          className="font-[var(--font-sans)] text-xs px-2 py-[3px] border border-[var(--color-cream-dark)] text-[var(--color-navy)] bg-[var(--color-cream)]"
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

  return (
    <Modal open={open} onClose={handleClose} className="max-w-[600px]">
      <ModalHeader title={frag.name} onClose={handleClose} />
      <ModalBody>
      <div className="space-y-5">
        {frag.house && (
          <div className="font-[var(--font-sans)] text-xs tracking-[0.08em] uppercase text-[var(--color-navy)]">
            {frag.house}
          </div>
        )}
        {/* Status + accords header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={frag.status} />
            {frag.isDupe && frag.dupeFor && (
              <span className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
                Dupe for {frag.dupeFor}
              </span>
            )}
          </div>
          {compCount > 0 && (
            <span className="font-[var(--font-sans)] text-xs text-[var(--color-accent)]">
              {compCount} {compCount === 1 ? "compliment" : "compliments"}
            </span>
          )}
        </div>

        {/* Personal section */}
        <div>
          <div className="font-[var(--font-sans)] text-xs tracking-[0.12em] uppercase text-[var(--color-navy)] mb-2">
            Personal
          </div>
          <div className="border border-[var(--color-cream-dark)] px-3 py-1">
            {frag.personalRating ? (
              <div className="flex gap-3 py-[5px] border-b border-[var(--color-cream-dark)]">
                <span className="w-[110px] shrink-0 font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase text-[var(--color-navy)]">Rating</span>
                <span className="font-[var(--font-sans)] text-xs text-[var(--color-accent)] tracking-[1px]">{starsDisplay}</span>
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
            <div className="font-[var(--font-sans)] text-xs tracking-[0.12em] uppercase text-[var(--color-navy)] mb-2">
              Notes
            </div>
            <p className="font-[var(--font-sans)] text-sm text-[var(--color-navy)] leading-relaxed whitespace-pre-wrap">
              {frag.personalNotes}
            </p>
          </div>
        )}

        {/* Community section */}
        {(cd || accords.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-[var(--font-sans)] text-xs tracking-[0.12em] uppercase text-[var(--color-navy)]">
                Community
              </div>
              <button
                onClick={() => setFlagOpen((v) => !v)}
                className="font-[var(--font-sans)] text-xs tracking-[0.08em] text-[var(--color-navy)] hover:text-[var(--color-destructive)] transition-colors border-none bg-none cursor-pointer p-0"
              >
                {flagOpen ? "Cancel flag" : "Flag incorrect data"}
              </button>
            </div>

            {flagOpen && (
              <div className="border border-[var(--color-cream-dark)] bg-[var(--color-cream-dark)] px-3 py-3 mb-3 flex flex-col gap-2">
                <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)] mb-1">Which field is incorrect?</div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {FLAG_FIELDS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFlagField(f)}
                      className={`font-[var(--font-sans)] text-xs px-2 py-1 border transition-colors cursor-pointer ${flagField === f ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white" : "border-[var(--color-cream-dark)] text-[var(--color-navy)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"}`}
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
                  className="w-full px-2 py-1.5 border border-[var(--color-cream-dark)] bg-[var(--color-cream)] font-[var(--font-sans)] text-sm text-[var(--color-navy)] placeholder:text-[var(--color-cream-dark)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
                />
                <button
                  onClick={submitFlag}
                  disabled={flagging}
                  className="self-start px-4 py-1.5 font-[var(--font-sans)] text-xs tracking-[0.08em] uppercase bg-[var(--color-accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {flagging ? "Submitting..." : "Submit flag"}
                </button>
              </div>
            )}

            <div className="border border-[var(--color-cream-dark)] px-3 py-1">
              <DetailRow label="Avg price" value={cd?.avgPrice?.replace(/~/g, "") ?? null} />
              <DetailRow label="Community rating" value={cd?.communityRating ? `${cd.communityRating}${cd.ratingVoteCount ? ` (${cd.ratingVoteCount} votes)` : ""}` : null} />
              <DetailRow label="Parfumo rating" value={cd?.parfumoRating || null} />
              <DetailRow label="Longevity" value={cd?.communityLongevityLabel || null} />
              <DetailRow label="Sillage" value={cd?.communitySillageLabel || null} />
            </div>
            {accords.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase text-[var(--color-navy)] mb-1">Accords</div>
                <NoteChips raw={accords} />
              </div>
            )}
            {cd?.topNotes && cd.topNotes.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase text-[var(--color-navy)] mb-1">Top Notes</div>
                <NoteChips raw={cd.topNotes} />
              </div>
            )}
            {cd?.middleNotes && cd.middleNotes.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase text-[var(--color-navy)] mb-1">Middle Notes</div>
                <NoteChips raw={cd.middleNotes} />
              </div>
            )}
            {cd?.baseNotes && cd.baseNotes.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase text-[var(--color-navy)] mb-1">Base Notes</div>
                <NoteChips raw={cd.baseNotes} />
              </div>
            )}
          </div>
        )}
      </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {!readOnly && onDelete && !confirmDelete && (
              <button
                onClick={handleDelete}
                className="font-[var(--font-sans)] text-xs text-[var(--color-destructive)] border border-[var(--color-destructive)] px-3 py-[5px] hover:bg-[var(--color-destructive)] hover:text-white transition-colors"
              >
                Delete
              </button>
            )}
            {!readOnly && onDelete && confirmDelete && (
              <>
                <span className="font-[var(--font-sans)] text-xs text-[var(--color-destructive)]">Remove permanently?</span>
                <button
                  onClick={handleDelete}
                  className="font-[var(--font-sans)] text-xs bg-[var(--color-destructive)] text-white px-3 py-[5px] hover:opacity-90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-[var(--font-sans)] text-xs border border-[var(--color-cream-dark)] text-[var(--color-navy)] px-3 py-[5px] hover:border-[var(--color-navy)]"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && onEdit && (
              <button
                onClick={() => { handleClose(); onEdit(frag!); }}
                className="px-4 py-[7px] font-[var(--font-sans)] text-xs border border-[var(--color-cream-dark)] text-[var(--color-navy)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-5 py-[7px] font-[var(--font-sans)] text-xs bg-[var(--color-accent)] text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
