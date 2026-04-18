"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { starsStr, parseRating, getAccords, getCompCount, shortFragType } from "@/lib/frag-utils";
import { StatusBadge } from "@/components/ui/frag-row";
import { getCommunityData } from "@/lib/data";
import { submitCommunityFlag } from "@/lib/data/mutations";
import { useUser } from "@/lib/user-context";
import { useToast } from "@/components/ui/toast";
import { TabPill } from "@/components/ui/tab-pill";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";

const FLAG_FIELDS = [
  "Accords", "Top Notes", "Middle Notes", "Base Notes",
  "Avg Price", "Longevity", "Sillage", "Community Rating", "Other",
];

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-[5px] border-b border-[var(--color-cream-dark)] last:border-0">
      <span className="w-[110px] shrink-0 font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)]">
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
      toast("Flag submitted. Thanks!", "success");
      setFlagOpen(false);
      setFlagNote("");
      setFlagField(FLAG_FIELDS[0]);
    } catch {
      toast("Failed to submit flag.", "error");
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
          <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-wide)] uppercase text-[var(--color-navy)]">
            {frag.house}
          </div>
        )}
        {frag.isDupe && frag.dupeFor && (
          <div className="font-[var(--font-sans)]" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', fontStyle: 'italic' }}>
            dupe of {frag.dupeFor}
          </div>
        )}
        {/* Status + accords header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={frag.status} />
            {frag.isDupe && (
              <span style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-navy)', borderRadius: 'var(--radius-full)', padding: 'var(--space-half) var(--space-2)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-label)', color: 'var(--color-navy)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
                Dupe
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
          <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-lg)] uppercase text-[var(--color-navy)] mb-2">
            Personal
          </div>
          <div className="border border-[var(--color-cream-dark)] px-3 py-1">
            {frag.personalRating ? (
              <div className="flex gap-3 py-[5px] border-b border-[var(--color-cream-dark)]">
                <span className="w-[110px] shrink-0 font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)]">Rating</span>
                <span className="font-[var(--font-sans)] text-xs text-[var(--color-accent)] tracking-[1px]">{starsDisplay}</span>
              </div>
            ) : null}
            {frag.type && shortFragType(frag.type) && (
              <div className="flex gap-3 py-[5px] border-b border-[var(--color-cream-dark)] items-center">
                <span className="w-[110px] shrink-0 font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)]">Type</span>
                <span style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-row-divider)', borderRadius: 'var(--radius-full)', padding: 'var(--space-half) var(--space-2)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-label)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {shortFragType(frag.type)}
                </span>
              </div>
            )}
            <DetailRow label="Sizes" value={(frag.sizes ?? []).join(", ") || null} />
            <DetailRow label="Bought from" value={frag.whereBought} />
            <DetailRow label="Purchase date" value={purchaseStr} />
            <DetailRow label="Price" value={frag.purchasePrice} />
          </div>
        </div>

        {/* Personal notes */}
        {frag.personalNotes && (
          <div>
            <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-lg)] uppercase text-[var(--color-navy)] mb-2">
              Notes
            </div>
            <p className="font-[var(--font-sans)] text-[length:var(--text-sm)] text-[var(--color-navy)] leading-relaxed whitespace-pre-wrap">
              {frag.personalNotes}
            </p>
          </div>
        )}

        {/* Community section */}
        {(cd || accords.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-lg)] uppercase text-[var(--color-navy)]">
                Community
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFlagOpen((v) => !v)}>
                {flagOpen ? "Cancel flag" : "Flag incorrect data"}
              </Button>
            </div>

            {flagOpen && (
              <div className="border border-[var(--color-cream-dark)] bg-[var(--color-cream-dark)] px-3 py-3 mb-3 flex flex-col gap-2">
                <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)] mb-1">Which field is incorrect?</div>
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {FLAG_FIELDS.map((f) => (
                    <TabPill
                      key={f}
                      label={f}
                      active={flagField === f}
                      onClick={() => setFlagField(f)}
                    />
                  ))}
                </div>
                <Textarea
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  placeholder="What's wrong? (optional)"
                  rows={2}
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

            <div className="border border-[var(--color-cream-dark)] px-3 py-1">
              <DetailRow label="Avg price" value={cd?.avgPrice?.replace(/~/g, "") ?? null} />
              <DetailRow label="Community rating" value={cd?.communityRating ? `${cd.communityRating}${cd.ratingVoteCount ? ` (${cd.ratingVoteCount} votes)` : ""}` : null} />
              <DetailRow label="Parfumo rating" value={cd?.parfumoRating || null} />
              <DetailRow label="Longevity" value={cd?.communityLongevityLabel || null} />
              <DetailRow label="Sillage" value={cd?.communitySillageLabel || null} />
            </div>
            {accords.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)] mb-1">Accords</div>
                <NoteChips raw={accords} />
              </div>
            )}
            {cd?.topNotes && cd.topNotes.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)] mb-1">Top Notes</div>
                <NoteChips raw={cd.topNotes} />
              </div>
            )}
            {cd?.middleNotes && cd.middleNotes.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)] mb-1">Middle Notes</div>
                <NoteChips raw={cd.middleNotes} />
              </div>
            )}
            {cd?.baseNotes && cd.baseNotes.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--font-sans)] text-xs tracking-[var(--tracking-md)] uppercase text-[var(--color-navy)] mb-1">Base Notes</div>
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
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
            {!readOnly && onDelete && confirmDelete && (
              <>
                <span className="font-[var(--font-sans)] text-xs text-[var(--color-destructive)]">Remove permanently?</span>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && onEdit && (
              <Button variant="primary" size="sm" onClick={() => { handleClose(); onEdit(frag!); }}>
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
