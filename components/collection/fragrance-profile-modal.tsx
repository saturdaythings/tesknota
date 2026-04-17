"use client";

import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel, OptionalTag } from '@/components/ui/field-label';
import { TabPill } from '@/components/ui/tab-pill';
import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { shortFragType } from '@/lib/frag-utils';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import { useToast } from '@/components/ui/toast';
import { WISHLIST_PRIORITY_LABELS, type WishlistPriority } from '@/types';
import type { CommunityFrag, UserFragrance, FragranceStatus, FragranceType } from '@/types';

// ── Constants ──────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'CURRENT', label: 'Current Collection' },
  { value: 'PREVIOUSLY_OWNED', label: 'Previously Owned' },
  { value: 'FINISHED', label: 'Finished (Empty Bottle)' },
  { value: 'WANT_TO_BUY', label: 'Wishlist — Want to Buy' },
  { value: 'WANT_TO_SMELL', label: 'Wishlist — Want to Smell' },
  { value: 'DONT_LIKE', label: "Have Smelled — Don't Like" },
];

const TYPE_OPTIONS = [
  { value: 'Extrait de Parfum', label: 'Extrait de Parfum' },
  { value: 'Eau de Parfum', label: 'Eau de Parfum' },
  { value: 'Eau de Toilette', label: 'Eau de Toilette' },
  { value: 'Cologne', label: 'Cologne' },
  { value: 'Perfume Concentré', label: 'Perfume Concentré' },
  { value: 'Perfume Oil', label: 'Perfume Oil' },
  { value: 'Body Spray', label: 'Body Spray' },
  { value: 'Other', label: 'Other' },
];

const STATUS_LABELS: Record<FragranceStatus, string> = {
  CURRENT: 'Current Collection',
  PREVIOUSLY_OWNED: 'Previously Owned',
  FINISHED: 'Finished',
  WANT_TO_BUY: 'Wishlist — Want to Buy',
  WANT_TO_SMELL: 'Wishlist — Want to Smell',
  DONT_LIKE: "Don't Like",
  WANT_TO_IDENTIFY: 'Saved to Identify',
};

const ELIGIBLE_STATUSES = new Set<FragranceStatus>(['CURRENT', 'PREVIOUSLY_OWNED', 'FINISHED']);
const WISHLIST_STATUSES = new Set<FragranceStatus>(['WANT_TO_BUY', 'WANT_TO_SMELL']);
const PRIORITY_KEYS: WishlistPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

function genId(): string {
  return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Sub-components ─────────────────────────────────────────

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-[2px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{ fontSize: '18px', color: n <= value ? 'var(--color-accent)' : 'var(--color-sand)' }}
        >
          {n <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-[2px]">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
            onClick={() => onChange(value === n ? 0 : n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="bg-transparent border-none cursor-pointer p-0 leading-none"
            style={{ fontSize: '22px', color: filled ? 'var(--color-accent)' : 'var(--color-sand)' }}
          >
            {filled ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
}

function NotesPills({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {notes.map((n) => (
        <span
          key={n}
          className="font-sans"
          style={{
            fontSize: 'var(--text-label)',
            letterSpacing: '0.06em',
            color: 'var(--color-navy)',
            background: 'rgba(30,45,69,0.07)',
            borderRadius: '2px',
            padding: '2px 8px',
          }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="font-sans uppercase flex-shrink-0"
        style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)', minWidth: '80px' }}
      >
        {label}
      </span>
      <span className="font-sans" style={{ fontSize: '13px', color: 'var(--color-navy)' }}>
        {value}
      </span>
    </div>
  );
}

// ── Views ──────────────────────────────────────────────────

type View = 'profile' | 'add-collection' | 'confirm-log';

// ── Main component ─────────────────────────────────────────

interface FragranceProfileModalProps {
  frag: CommunityFrag | null;
  onClose: () => void;
}

export function FragranceProfileModal({ frag, onClose }: FragranceProfileModalProps) {
  const { user } = useUser();
  const { fragrances, addFrag } = useData();
  const { toast } = useToast();

  const [view, setView] = useState<View>('profile');
  const [pendingLog, setPendingLog] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [logPrefillId, setLogPrefillId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // add-collection form state
  const [status, setStatus] = useState<FragranceStatus>('CURRENT');
  const [fragType, setFragType] = useState<FragranceType | ''>('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [wishlistPriority, setWishlistPriority] = useState<WishlistPriority | null>(null);

  // confirm-log sub-type
  const [confirmLogType, setConfirmLogType] = useState<'wishlist' | 'unowned'>('unowned');

  const myFrags = user ? fragrances.filter((f) => f.userId === user.id) : [];
  const existingEntry = frag
    ? myFrags.find((f) => f.fragranceId === frag.fragranceId) ?? null
    : null;

  const isInCollection = existingEntry ? ELIGIBLE_STATUSES.has(existingEntry.status) : false;
  const isInWishlist = existingEntry ? WISHLIST_STATUSES.has(existingEntry.status) : false;

  // Reset on open/close
  useEffect(() => {
    if (!frag) return;
    setView('profile');
    setPendingLog(false);
    setSaving(false);
    setStatus('CURRENT');
    setFragType(frag.fragranceType as FragranceType | '');
    setRating(0);
    setNotes('');
    setWishlistPriority(null);
    setLogOpen(false);
    setLogPrefillId(undefined);
  }, [frag?.fragranceId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogCompliment() {
    if (isInCollection && existingEntry) {
      const prefillId = existingEntry.fragranceId || existingEntry.id;
      onClose();
      setLogPrefillId(prefillId);
      setLogOpen(true);
      return;
    }
    if (isInWishlist) {
      setConfirmLogType('wishlist');
    } else {
      setConfirmLogType('unowned');
    }
    setPendingLog(true);
    setView('confirm-log');
  }

  function handleAddToWishlist() {
    setStatus('WANT_TO_BUY');
    setWishlistPriority(null);
    setView('add-collection');
  }

  async function handleSaveCollection() {
    if (!user || !frag) return;
    setSaving(true);
    try {
      const newFrag: UserFragrance = {
        id: genId(),
        fragranceId: frag.fragranceId,
        userId: user.id,
        name: frag.fragranceName,
        house: frag.fragranceHouse,
        status,
        sizes: [],
        type: fragType || null,
        personalRating: rating || null,
        statusRating: null,
        whereBought: null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: null,
        isDupe: false,
        dupeFor: '',
        personalNotes: notes.trim(),
        createdAt: new Date().toISOString(),
        wishlistPriority: WISHLIST_STATUSES.has(status) ? wishlistPriority : null,
      };
      await addFrag(newFrag);
      toast(frag.fragranceName + ' added to your collection', 'success');
      if (pendingLog) {
        const prefillId = frag.fragranceId || newFrag.id;
        onClose();
        setLogPrefillId(prefillId);
        setLogOpen(true);
      } else {
        onClose();
      }
    } catch {
      toast('Failed to save. Check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!frag && !logOpen) return null;

  return (
    <>
      {/* Log Compliment modal — floats above profile modal */}
      <LogComplimentModal
        open={logOpen}
        onClose={() => { setLogOpen(false); setLogPrefillId(undefined); }}
        prefillFragId={logPrefillId}
      />

      <Modal open={!!frag} onClose={onClose}>
        {/* Profile view */}
        {view === 'profile' && frag && (
          <>
            <ModalHeader
              title={frag.fragranceName}
              onClose={onClose}
            />
            <ModalBody>
              {/* House + type row */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div
                  className="font-sans uppercase"
                  style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                >
                  {frag.fragranceHouse}
                </div>
                {frag.fragranceType && shortFragType(frag.fragranceType) && (
                  <span
                    className="font-sans uppercase"
                    style={{
                      fontSize: 'var(--text-label)',
                      letterSpacing: 'var(--tracking-wide)',
                      color: 'var(--color-meta-text)',
                      background: 'var(--color-cream-dark)',
                      border: '1px solid var(--color-row-divider)',
                      borderRadius: 'var(--radius-full)',
                      padding: '2px var(--space-2)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shortFragType(frag.fragranceType)}
                  </span>
                )}
              </div>

              {/* Community stats */}
              <div className="flex flex-col gap-2 mb-6">
                <MetaRow label="Avg Price" value={frag.avgPrice ?? ''} />
                <MetaRow label="Rating" value={frag.communityRating ? `${frag.communityRating} / 10` : ''} />
                <MetaRow label="Longevity" value={frag.communityLongevityLabel} />
                <MetaRow label="Sillage" value={frag.communitySillageLabel} />
              </div>

              {/* Notes sections */}
              {(frag.topNotes.length > 0 || frag.middleNotes.length > 0 || frag.baseNotes.length > 0) && (
                <div className="flex flex-col gap-3 mb-6">
                  {frag.topNotes.length > 0 && (
                    <div>
                      <div
                        className="font-sans uppercase mb-1"
                        style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                      >
                        Top Notes
                      </div>
                      <NotesPills notes={frag.topNotes} />
                    </div>
                  )}
                  {frag.middleNotes.length > 0 && (
                    <div>
                      <div
                        className="font-sans uppercase mb-1"
                        style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                      >
                        Heart Notes
                      </div>
                      <NotesPills notes={frag.middleNotes} />
                    </div>
                  )}
                  {frag.baseNotes.length > 0 && (
                    <div>
                      <div
                        className="font-sans uppercase mb-1"
                        style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                      >
                        Base Notes
                      </div>
                      <NotesPills notes={frag.baseNotes} />
                    </div>
                  )}
                </div>
              )}

              {/* Accords */}
              {frag.fragranceAccords.length > 0 && (
                <div className="mb-6">
                  <div
                    className="font-sans uppercase mb-2"
                    style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                  >
                    Accords
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {frag.fragranceAccords.map((a) => (
                      <TabPill key={a} label={a} active={false} onClick={() => {}} />
                    ))}
                  </div>
                </div>
              )}

              {/* Personal section — if user has this frag */}
              {existingEntry && (
                <div
                  className="mt-2"
                  style={{
                    borderTop: '1px solid var(--color-cream-dark)',
                    paddingTop: 'var(--space-5)',
                  }}
                >
                  <div
                    className="font-sans uppercase mb-4"
                    style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                  >
                    Your Collection
                  </div>
                  <div className="flex flex-col gap-3">
                    <MetaRow label="Status" value={STATUS_LABELS[existingEntry.status] ?? existingEntry.status} />
                    {existingEntry.type && <MetaRow label="Type" value={existingEntry.type} />}
                    {existingEntry.personalRating != null && (
                      <div className="flex items-baseline gap-3">
                        <span
                          className="font-sans uppercase flex-shrink-0"
                          style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)', minWidth: '80px' }}
                        >
                          My Rating
                        </span>
                        <StarDisplay value={existingEntry.personalRating} />
                      </div>
                    )}
                    {existingEntry.personalNotes && (
                      <div>
                        <div
                          className="font-sans uppercase mb-1"
                          style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy-mid)' }}
                        >
                          My Notes
                        </div>
                        <div
                          className="font-serif italic"
                          style={{ fontSize: '15px', color: 'var(--color-navy)', lineHeight: 1.6 }}
                        >
                          {existingEntry.personalNotes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <div style={{ flex: 1 }} />
              {!existingEntry && (
                <Button variant="secondary" onClick={handleAddToWishlist}>
                  Add to Wishlist
                </Button>
              )}
              {!isInCollection && (
                <Button variant="secondary" onClick={() => setView('add-collection')}>
                  {existingEntry ? 'Edit in Collection' : 'Add to Collection'}
                </Button>
              )}
              <Button variant="primary" onClick={handleLogCompliment}>
                Log a Compliment
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Add to Collection view */}
        {view === 'add-collection' && frag && (
          <>
            <ModalHeader
              title={pendingLog ? 'Add to Collection First' : 'Add to Collection'}
              onClose={onClose}
            />
            <ModalBody>
              {pendingLog && (
                <p
                  className="font-sans mb-5"
                  style={{ fontSize: '14px', color: 'var(--color-navy-mid)', lineHeight: 1.6 }}
                >
                  Add {frag.fragranceName} to your collection before logging a compliment.
                </p>
              )}

              {/* Frag identity */}
              <div
                className="mb-5"
                style={{
                  background: 'rgba(30,45,69,0.04)',
                  borderRadius: '3px',
                  padding: '12px 16px',
                }}
              >
                <div className="font-serif italic" style={{ fontSize: '18px', color: 'var(--color-navy)', lineHeight: 1.2 }}>
                  {frag.fragranceName}
                </div>
                <div className="font-sans uppercase mt-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: '0.1em' }}>
                  {frag.fragranceHouse}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={(v) => setStatus(v as FragranceStatus)}
                    placeholder="Select status"
                  />
                </div>

                <div>
                  <FieldLabel>
                    Type <OptionalTag />
                  </FieldLabel>
                  <Select
                    options={TYPE_OPTIONS}
                    value={fragType}
                    onChange={(v) => setFragType(v as FragranceType | '')}
                    placeholder="Select type"
                  />
                </div>

                <div>
                  <FieldLabel>
                    My Rating <OptionalTag />
                  </FieldLabel>
                  <StarRating value={rating} onChange={setRating} />
                </div>

                <div>
                  <FieldLabel>
                    Personal Notes <OptionalTag />
                  </FieldLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thoughts, occasions, memories..."
                    rows={3}
                    style={{
                      fontSize: '13px',
                      letterSpacing: '0.08em',
                      color: 'var(--color-navy)',
                    }}
                  />
                </div>

                {WISHLIST_STATUSES.has(status) && (
                  <div>
                    <FieldLabel>
                      Priority <OptionalTag />
                    </FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {PRIORITY_KEYS.map((p) => (
                        <TabPill
                          key={p}
                          label={WISHLIST_PRIORITY_LABELS[p].label}
                          active={wishlistPriority === p}
                          onClick={() => setWishlistPriority(wishlistPriority === p ? null : p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={() => { setView('profile'); setPendingLog(false); }} disabled={saving}>
                Back
              </Button>
              <div style={{ flex: 1 }} />
              <Button variant="primary" onClick={handleSaveCollection} disabled={saving}>
                {saving ? 'Saving...' : WISHLIST_STATUSES.has(status) ? 'Save to Wishlist' : pendingLog ? 'Save & Log Compliment' : 'Save to Collection'}
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Confirm-log view */}
        {view === 'confirm-log' && frag && (
          <>
            <ModalHeader
              title="Log a Compliment"
              onClose={onClose}
            />
            <ModalBody>
              <div
                className="font-serif italic mb-2"
                style={{ fontSize: '22px', color: 'var(--color-navy)', lineHeight: 1.2 }}
              >
                {frag.fragranceName}
              </div>
              <div
                className="font-sans uppercase mb-5"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: '0.1em' }}
              >
                {frag.fragranceHouse}
              </div>

              {confirmLogType === 'wishlist' ? (
                <p className="font-sans" style={{ fontSize: '14px', color: 'var(--color-navy)', lineHeight: 1.7 }}>
                  This fragrance is in your wishlist. Move it to your collection first for a complete record, or log the compliment anyway.
                </p>
              ) : (
                <p className="font-sans" style={{ fontSize: '14px', color: 'var(--color-navy)', lineHeight: 1.7 }}>
                  This fragrance isn&apos;t in your collection yet. Add it first for a complete record, or log the compliment anyway.
                </p>
              )}
            </ModalBody>
            <ModalFooter className="flex-wrap gap-2">
              <Button variant="ghost" onClick={() => { setView('profile'); setPendingLog(false); }}>
                Cancel
              </Button>
              <div style={{ flex: 1 }} />
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus('CURRENT');
                  setView('add-collection');
                }}
              >
                {confirmLogType === 'wishlist' ? 'Promote to Collection' : 'Add to Collection'}
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onClose();
                  setLogPrefillId(undefined);
                  setLogOpen(true);
                }}
              >
                Log Anyway
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </>
  );
}
