"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { starsStr, parseRating, getAccords, getCompCount } from "@/lib/frag-utils";
import { STATUS_LABELS } from "@/types";
import { statusColorClass } from "@/components/ui/frag-row";
import { getCommunityData } from "@/lib/data";
import type { UserFragrance, UserCompliment, CommunityFrag } from "@/types";
import type { UserId } from "@/lib/user-context";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-[5px] border-b border-[var(--b1)] last:border-0">
      <span className="w-[110px] shrink-0 font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)]">
        {label}
      </span>
      <span className="font-[var(--mono)] text-xs text-[var(--ink2)]">{value}</span>
    </div>
  );
}

function NoteChips({ raw }: { raw: string }) {
  if (!raw.trim()) return null;
  const items = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((n) => (
        <span
          key={n}
          className="font-[var(--mono)] text-[10px] px-2 py-[3px] border border-[var(--b2)] text-[var(--ink3)] bg-[var(--b1)]"
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
  userId: UserId;
  onEdit: (frag: UserFragrance) => void;
  onDelete: (frag: UserFragrance) => void;
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
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!frag) return null;

  const cd = getCommunityData(frag.name, frag.house);
  const accords = getAccords(frag, communityFrags);
  const compCount = getCompCount(frag.fragranceId || frag.id, compliments, userId);
  const starsDisplay = starsStr(parseRating(frag.personalRating));
  const purchaseStr = [frag.purchaseMonth, frag.purchaseYear].filter(Boolean).join(" ") || frag.purchaseDate || null;

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete(frag!);
  }

  function handleClose() {
    setConfirmDelete(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={frag.name}
      subtitle={frag.house || undefined}
      className="max-w-[600px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {!confirmDelete ? (
              <button
                onClick={handleDelete}
                className="font-[var(--mono)] text-[11px] text-[var(--rose-tk)] border border-[var(--rose-tk)] px-3 py-[5px] hover:bg-[var(--rose-tk)] hover:text-white transition-colors"
              >
                Delete
              </button>
            ) : (
              <>
                <span className="font-[var(--mono)] text-[11px] text-[var(--rose-tk)]">Remove permanently?</span>
                <button
                  onClick={handleDelete}
                  className="font-[var(--mono)] text-[11px] bg-[var(--rose-tk)] text-white px-3 py-[5px] hover:opacity-90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-[var(--mono)] text-[11px] border border-[var(--b3)] text-[var(--ink3)] px-3 py-[5px] hover:border-[var(--b4)]"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { handleClose(); onEdit(frag!); }}
              className="px-4 py-[7px] font-[var(--mono)] text-xs border border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-[7px] font-[var(--mono)] text-xs bg-[var(--blue)] text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status + accords header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`font-[var(--mono)] text-[11px] tracking-[0.06em] ${statusColorClass(frag.status)}`}>
              {STATUS_LABELS[frag.status] ?? frag.status}
            </span>
            {frag.isDupe && frag.dupeFor && (
              <span className="ml-3 font-[var(--mono)] text-[10px] text-[var(--ink3)]">
                Dupe for {frag.dupeFor}
              </span>
            )}
          </div>
          {compCount > 0 && (
            <span className="font-[var(--mono)] text-[11px] text-[var(--blue)]">
              {compCount} {compCount === 1 ? "compliment" : "compliments"}
            </span>
          )}
        </div>

        {/* Personal section */}
        <div>
          <div className="font-[var(--mono)] text-[10px] tracking-[0.12em] uppercase text-[var(--ink3)] mb-2">
            Personal
          </div>
          <div className="border border-[var(--b2)] px-3 py-1">
            {frag.personalRating ? (
              <div className="flex gap-3 py-[5px] border-b border-[var(--b1)]">
                <span className="w-[110px] shrink-0 font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)]">Rating</span>
                <span className="font-[var(--mono)] text-xs text-[var(--warm-text)] tracking-[1px]">{starsDisplay}</span>
              </div>
            ) : null}
            <DetailRow label="Longevity" value={frag.personalLong} />
            <DetailRow label="Sillage" value={frag.personalSill} />
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
            <div className="font-[var(--mono)] text-[10px] tracking-[0.12em] uppercase text-[var(--ink3)] mb-2">
              Notes
            </div>
            <p className="font-[var(--body)] text-sm text-[var(--ink2)] leading-relaxed whitespace-pre-wrap">
              {frag.personalNotes}
            </p>
          </div>
        )}

        {/* Community section */}
        {(cd || accords.length > 0) && (
          <div>
            <div className="font-[var(--mono)] text-[10px] tracking-[0.12em] uppercase text-[var(--ink3)] mb-2">
              Community
            </div>
            <div className="border border-[var(--b2)] px-3 py-1">
              <DetailRow label="Avg price" value={cd?.avgPrice?.replace(/~/g, "") ?? null} />
              <DetailRow label="Community rating" value={cd?.communityRating ? `${cd.communityRating}${cd.ratingVoteCount ? ` (${cd.ratingVoteCount} votes)` : ""}` : null} />
              <DetailRow label="Parfumo rating" value={cd?.parfumoRating || null} />
              <DetailRow label="Longevity" value={cd?.communityLongevityLabel || null} />
              <DetailRow label="Sillage" value={cd?.communitySillageLabel || null} />
            </div>
            {accords.length > 0 && (
              <div className="mt-3">
                <div className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)] mb-1">Accords</div>
                <NoteChips raw={accords.join(", ")} />
              </div>
            )}
            {cd?.topNotes && (
              <div className="mt-3">
                <div className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)] mb-1">Top Notes</div>
                <NoteChips raw={cd.topNotes} />
              </div>
            )}
            {cd?.middleNotes && (
              <div className="mt-3">
                <div className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)] mb-1">Middle Notes</div>
                <NoteChips raw={cd.middleNotes} />
              </div>
            )}
            {cd?.baseNotes && (
              <div className="mt-3">
                <div className="font-[var(--mono)] text-[10px] tracking-[0.1em] uppercase text-[var(--ink3)] mb-1">Base Notes</div>
                <NoteChips raw={cd.baseNotes} />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
