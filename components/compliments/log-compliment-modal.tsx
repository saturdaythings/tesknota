"use client";

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import { useToast } from '@/components/ui/toast';
import { MONTHS } from '@/lib/frag-utils';
import type { UserCompliment, UserFragrance, Relation, ComplimenterGender } from '@/types';

// ── Constants ──────────────────────────────────────────────

const RELATIONS: { value: Relation; label: string }[] = [
  { value: 'Stranger', label: 'Stranger' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Colleague / Client', label: 'Colleague / Client' },
  { value: 'Family', label: 'Family' },
  { value: 'Significant Other', label: 'Significant Other' },
  { value: 'Other', label: 'Other' },
];

const GENDERS: { value: ComplimenterGender; label: string }[] = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
];

const ELIGIBLE_STATUSES = new Set(['CURRENT', 'PREVIOUSLY_OWNED', 'FINISHED']);

const YEARS = Array.from(
  { length: new Date().getFullYear() - 2019 },
  (_, i) => String(new Date().getFullYear() - i),
);

function genId(): string {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function normalizeMonth(m: string): string {
  if (!m) return String(new Date().getMonth() + 1).padStart(2, '0');
  if (/^\d{1,2}$/.test(m)) return m.padStart(2, '0');
  const idx = MONTHS.findIndex((mn) => mn.toLowerCase() === m.toLowerCase().slice(0, 3));
  return idx >= 0 ? String(idx + 1).padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
}

// ── Inline components ──────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-1 font-sans font-medium uppercase"
      style={{ fontSize: '11px', color: 'var(--color-navy)', letterSpacing: '0.12em' }}
    >
      {children}
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="font-sans font-medium transition-colors duration-100 cursor-pointer"
            style={{
              height: '40px',
              padding: '0 14px',
              fontSize: '13px',
              borderRadius: '3px',
              border: active ? '1px solid var(--color-navy)' : '1px solid var(--color-cream-dark)',
              background: active ? 'var(--color-navy)' : 'var(--color-cream)',
              color: active ? 'white' : 'var(--color-navy)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FragSearch({
  value,
  onSelect,
  frags,
  exclude,
  locked,
  error,
}: {
  value: UserFragrance | null;
  onSelect: (f: UserFragrance | null) => void;
  frags: UserFragrance[];
  exclude?: string;
  locked?: boolean;
  error?: string;
}) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.name ?? '');
  }, [value]);

  const matches = frags
    .filter(
      (f) =>
        f.id !== exclude &&
        (f.fragranceId !== exclude || !exclude) &&
        (query.trim().length === 0 ||
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.house.toLowerCase().includes(query.toLowerCase())),
    )
    .slice(0, 8);

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        value={query}
        readOnly={locked}
        disabled={locked}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onSelect(null);
          setOpen(true);
        }}
        onFocus={() => !locked && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search your collection..."
        className="w-full h-10 px-3 rounded-[3px] font-sans outline-none transition-[border-color] duration-150 focus:border-[var(--color-accent)] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          fontSize: '15px',
          background: 'var(--color-cream)',
          border: error
            ? '1px solid var(--color-destructive)'
            : '1px solid var(--color-cream-dark)',
          color: 'var(--color-navy)',
        }}
      />
      {open && matches.length > 0 && (
        <div
          className="absolute left-0 right-0 z-50 overflow-y-auto"
          style={{
            top: 'calc(100% + 4px)',
            background: 'var(--color-cream)',
            border: '1px solid var(--color-cream-dark)',
            borderRadius: '3px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxHeight: '220px',
          }}
        >
          {matches.map((f) => (
            <div
              key={f.id}
              onMouseDown={() => { onSelect(f); setOpen(false); }}
              className="flex flex-col justify-center cursor-pointer hover:bg-[var(--color-sand-light)] transition-colors"
              style={{
                height: '52px',
                padding: '0 12px',
                borderBottom: '1px solid var(--color-cream-dark)',
              }}
            >
              <div className="font-sans font-medium" style={{ fontSize: '13px', color: 'var(--color-navy)' }}>
                {f.name}
              </div>
              <div
                className="font-sans uppercase"
                style={{ fontSize: '11px', color: 'var(--color-sand)', letterSpacing: '0.08em' }}
              >
                {f.house}
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-1 font-sans" style={{ fontSize: '13px', color: 'var(--color-destructive)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────

export interface ComplimentModalProps {
  open: boolean;
  onClose: () => void;
  editing?: UserCompliment | null;
  prefillFragId?: string;
}

export function LogComplimentModal({ open, onClose, editing, prefillFragId }: ComplimentModalProps) {
  const { user } = useUser();
  const { fragrances, addComp, editComp, removeComp } = useData();
  const { toast } = useToast();

  const isEdit = !!editing;
  const now = new Date();

  const eligible = user
    ? fragrances.filter((f) => f.userId === user.id && ELIGIBLE_STATUSES.has(f.status))
    : [];

  // Form state
  const [primaryFrag, setPrimaryFrag] = useState<UserFragrance | null>(null);
  const [secondaryFrag, setSecondaryFrag] = useState<UserFragrance | null>(null);
  const [relation, setRelation] = useState<Relation | ''>('');
  const [gender, setGender] = useState<ComplimenterGender | ''>('');
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('US');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fragError, setFragError] = useState('');
  const [err, setErr] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFragError('');
    setErr('');
    setSaving(false);
    setConfirmDelete(false);

    if (editing) {
      const pf = fragrances.find(
        (f) => f.fragranceId === editing.primaryFragId || f.id === editing.primaryFragId,
      ) ?? null;
      const sf = editing.secondaryFragId
        ? fragrances.find(
            (f) => f.fragranceId === editing.secondaryFragId || f.id === editing.secondaryFragId,
          ) ?? null
        : null;
      setPrimaryFrag(pf);
      setSecondaryFrag(sf);
      setRelation(editing.relation);
      setGender(editing.gender ?? '');
      setMonth(normalizeMonth(editing.month));
      setYear(editing.year || String(now.getFullYear()));
      setLocation(editing.location ?? '');
      setCity(editing.city ?? '');
      setState(editing.state ?? editing.country ?? 'US');
      setNotes(editing.notes ?? '');
    } else {
      const pre = prefillFragId
        ? eligible.find((f) => f.id === prefillFragId || f.fragranceId === prefillFragId) ?? null
        : null;
      setPrimaryFrag(pre);
      setSecondaryFrag(null);
      setRelation('');
      setGender('');
      setMonth(String(now.getMonth() + 1).padStart(2, '0'));
      setYear(String(now.getFullYear()));
      setLocation('');
      setCity('');
      setState('US');
      setNotes('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, prefillFragId]);

  async function save() {
    if (!user) return;
    if (!primaryFrag) { setFragError('Select a fragrance.'); return; }
    setFragError('');
    setSaving(true);
    setErr('');

    const comp: UserCompliment = {
      id: editing?.id ?? genId(),
      userId: user.id,
      primaryFragId: primaryFrag.fragranceId || primaryFrag.id,
      primaryFrag: primaryFrag.name,
      secondaryFragId: secondaryFrag ? (secondaryFrag.fragranceId || secondaryFrag.id) : null,
      secondaryFrag: secondaryFrag?.name ?? null,
      gender: (gender as ComplimenterGender) || null,
      relation: (relation || 'Stranger') as Relation,
      month,
      year,
      location: location.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      country: state.trim() || 'US',
      notes: notes.trim() || null,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };

    try {
      if (isEdit) {
        await editComp(comp);
        toast('Compliment updated.', 'success');
      } else {
        await addComp(comp);
        toast('Compliment logged.', 'success');
      }
      onClose();
    } catch (e) {
      console.error(e);
      setErr('Save failed. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await removeComp(editing.id);
      toast('Compliment deleted.', 'success');
      onClose();
    } catch (e) {
      console.error(e);
      setErr('Delete failed.');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    fontSize: '15px',
    fontFamily: 'var(--font-sans)',
    background: 'var(--color-cream)',
    border: '1px solid var(--color-cream-dark)',
    borderRadius: '3px',
    color: 'var(--color-navy)',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={isEdit ? 'Edit Compliment' : 'Log a Compliment'} onClose={onClose} />

      <ModalBody>
        <div className="flex flex-col gap-5">
          {/* Fragrance */}
          <div>
            <FieldLabel>Fragrance *</FieldLabel>
            <FragSearch
              value={primaryFrag}
              onSelect={(f) => { setPrimaryFrag(f); if (f) setFragError(''); }}
              frags={eligible}
              error={fragError}
            />
          </div>

          {/* Layering fragrance */}
          <div>
            <FieldLabel>
              Layering Fragrance{' '}
              <span
                className="normal-case font-normal"
                style={{ letterSpacing: 0, color: 'var(--color-sand)', opacity: 0.7 }}
              >
                (optional)
              </span>
            </FieldLabel>
            <FragSearch
              value={secondaryFrag}
              onSelect={setSecondaryFrag}
              frags={eligible}
              exclude={primaryFrag?.fragranceId || primaryFrag?.id}
            />
          </div>

          {/* Relation */}
          <div>
            <FieldLabel>Relation *</FieldLabel>
            <ToggleGroup options={RELATIONS} value={relation} onChange={setRelation} />
          </div>

          {/* Gender */}
          <div>
            <FieldLabel>
              Gender{' '}
              <span
                className="normal-case font-normal"
                style={{ letterSpacing: 0, color: 'var(--color-sand)', opacity: 0.7 }}
              >
                (optional)
              </span>
            </FieldLabel>
            <ToggleGroup options={GENDERS} value={gender} onChange={setGender} />
          </div>

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Month *</FieldLabel>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                style={inputStyle}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Year *</FieldLabel>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={inputStyle}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <FieldLabel>
              Location{' '}
              <span
                className="normal-case font-normal"
                style={{ letterSpacing: 0, color: 'var(--color-sand)', opacity: 0.7 }}
              >
                (optional)
              </span>
            </FieldLabel>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bluegrass Lounge, coffee shop, gym..."
              style={{
                ...inputStyle,
                cursor: 'text',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                style={{ ...inputStyle, cursor: 'text', fontFamily: 'var(--font-sans)' }}
              />
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State / Country"
                style={{ ...inputStyle, cursor: 'text', fontFamily: 'var(--font-sans)' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <FieldLabel>
              Notes{' '}
              <span
                className="normal-case font-normal"
                style={{ letterSpacing: 0, color: 'var(--color-sand)', opacity: 0.7 }}
              >
                (optional)
              </span>
            </FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, reaction, moment..."
              rows={3}
              className="w-full p-3 rounded-[3px] font-sans outline-none transition-[border-color] focus:border-[var(--color-accent)] resize-y"
              style={{
                fontSize: '15px',
                minHeight: '80px',
                background: 'var(--color-cream)',
                border: '1px solid var(--color-cream-dark)',
                color: 'var(--color-navy)',
              }}
            />
          </div>

          {err && (
            <p className="font-sans" style={{ fontSize: '13px', color: 'var(--color-destructive)' }}>
              {err}
            </p>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        {/* Left: delete (edit mode only) */}
        <div className="flex items-center gap-3 flex-1">
          {isEdit && !confirmDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              Delete Compliment
            </Button>
          )}
          {isEdit && confirmDelete && (
            <div className="flex items-center gap-3">
              <span
                className="font-sans"
                style={{ fontSize: '13px', color: 'var(--color-destructive)' }}
              >
                Are you sure? This cannot be undone.
              </span>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Right: cancel + save */}
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={saving || confirmDelete}>
            {saving ? (
              <><Spinner /> {isEdit ? 'Saving...' : 'Logging...'}</>
            ) : (
              isEdit ? 'Save Changes' : 'Log Compliment'
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
