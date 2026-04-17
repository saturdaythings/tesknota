"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TabPill } from "@/components/ui/tab-pill";
import { FieldLabel, OptionalTag, RequiredMark } from "@/components/ui/field-label";
import { LogComplimentModal } from "@/components/compliments/log-compliment-modal";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { MONTHS } from "@/lib/frag-utils";
import type { UserFragrance, FragranceStatus, FragranceType, BottleSize, UserCompliment } from "@/types";

// ── Constants ──────────────────────────────────────────────

const STATUSES: { value: FragranceStatus; label: string }[] = [
  { value: "CURRENT", label: "Current" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "FINISHED", label: "Finished" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "DONT_LIKE", label: "Don't Like" },
  { value: "WANT_TO_IDENTIFY", label: "Identify Later" },
];

const SIZES: BottleSize[] = ["Sample", "Travel", "Full Bottle", "Decant"];

const TYPES: FragranceType[] = [
  "Extrait de Parfum",
  "Eau de Parfum",
  "Eau de Toilette",
  "Cologne",
  "Perfume Concentré",
  "Body Spray",
  "Perfume Oil",
  "Other",
];

const MONTH_OPTIONS = [
  { value: "", label: "—" },
  ...MONTHS.map((m) => ({ value: m, label: m })),
];

const YEAR_OPTIONS = [
  { value: "", label: "—" },
  ...Array.from(
    { length: new Date().getFullYear() - 1989 },
    (_, i) => String(new Date().getFullYear() - i),
  ).map((y) => ({ value: y, label: y })),
];

// ── Spinner ────────────────────────────────────────────────

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin" aria-hidden="true">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
      <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────

interface Props {
  frag: UserFragrance | null;
  open: boolean;
  onClose: () => void;
  compliments: UserCompliment[];
  userId: string;
  onDelete: (frag: UserFragrance) => void;
}

export function FragranceDetailModal({ frag, open, onClose, compliments, onDelete }: Props) {
  const { editFrag } = useData();
  const { toast } = useToast();

  const [status, setStatus] = useState<FragranceStatus>("CURRENT");
  const [rating, setRating] = useState(0);
  const [sizes, setSizes] = useState<BottleSize[]>([]);
  const [type, setType] = useState<FragranceType | "">("");
  const [purchaseMonth, setPurchaseMonth] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [whereBought, setWhereBought] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [compFormOpen, setCompFormOpen] = useState(false);
  const [err, setErr] = useState("");

  const fragCompliments = frag
    ? compliments.filter((c) => {
        const key = frag.fragranceId ?? frag.id;
        return c.primaryFragId === key || c.secondaryFragId === key;
      })
    : [];

  const handleClose = useCallback(() => {
    setConfirmDelete(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open || !frag) return;
    setStatus(frag.status);
    setRating(frag.personalRating ?? 0);
    setSizes(frag.sizes.length ? frag.sizes : []);
    setType(frag.type ?? "");
    setPurchaseMonth(frag.purchaseMonth ?? "");
    setPurchaseYear(frag.purchaseYear ?? "");
    setPurchasePrice(frag.purchasePrice ?? "");
    setWhereBought(frag.whereBought ?? "");
    setNotes(frag.personalNotes ?? "");
    setErr("");
    setSaving(false);
    setConfirmDelete(false);
  }, [open, frag]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, handleClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function toggleSize(s: BottleSize) {
    setSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function save() {
    if (!frag) return;
    setSaving(true);
    setErr("");
    try {
      await editFrag({
        ...frag,
        status,
        personalRating: rating || null,
        sizes,
        type: type || null,
        purchaseMonth: purchaseMonth || null,
        purchaseYear: purchaseYear || null,
        purchaseDate: purchaseMonth && purchaseYear ? `${purchaseMonth} ${purchaseYear}` : purchaseYear || null,
        purchasePrice: purchasePrice.trim() || null,
        whereBought: whereBought.trim() || null,
        personalNotes: notes.trim(),
      });
      toast("Fragrance updated.", "success");
      handleClose();
    } catch (e) {
      console.error(e);
      setErr("Save failed. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const inputCls =
    "w-full h-9 px-3 rounded-[2px] font-sans outline-none transition-[border-color] duration-150 " +
    "focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy-mid)]";
  const inputStyle: React.CSSProperties = {
    fontSize: "var(--text-sm)",
    fontWeight: 400,
    letterSpacing: "var(--tracking-sm)",
    background: "var(--color-cream)",
    border: "1px solid var(--color-meta-text)",
    color: "var(--color-meta-text)",
  };

  return (
    <>
      <LogComplimentModal
        open={compFormOpen}
        onClose={() => setCompFormOpen(false)}
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
        role="dialog"
        aria-modal="true"
        aria-label={frag?.name ?? "Edit fragrance"}
        style={{
          position: "fixed",
          zIndex: 251,
          background: "var(--color-cream)",
          display: "flex",
          flexDirection: "column",
          top: 0,
          right: 0,
          bottom: 0,
          width: "400px",
          boxShadow: "-4px 0 32px rgba(0,0,0,0.15)",
        }}
        className="max-sm:w-full max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:h-[90vh] max-sm:rounded-t-[12px]"
      >
        {/* Mobile drag handle */}
        <div
          className="sm:hidden"
          style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px", flexShrink: 0 }}
        >
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "var(--color-cream-dark)" }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "var(--space-4) var(--space-5)",
            borderBottom: "1px solid var(--color-cream-dark)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "22px",
                  fontStyle: "italic",
                  color: "var(--color-navy)",
                  fontWeight: 400,
                  lineHeight: 1.2,
                  marginBottom: "2px",
                }}
              >
                {frag?.name}
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "rgba(30,45,69,0.8)",
                }}
              >
                {frag?.house}
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close panel"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "rgba(30,45,69,0.8)",
                padding: "2px",
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-4) var(--space-5)" }}>
          <div className="flex flex-col gap-5">

            {/* Status */}
            <div>
              <FieldLabel>Status <RequiredMark /></FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <TabPill key={s.value} label={s.label} active={status === s.value} onClick={() => setStatus(s.value)} />
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <FieldLabel>Personal Rating <OptionalTag /></FieldLabel>
              <div style={{ display: "flex", gap: "4px" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? 0 : n)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      fontSize: "22px",
                      lineHeight: 1,
                      color: n <= rating ? "var(--color-accent)" : "var(--color-cream-dark)",
                      transition: "color 120ms",
                    }}
                    aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                  >
                    {n <= rating ? "\u2605" : "\u2606"}
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <FieldLabel>Size <OptionalTag /></FieldLabel>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <TabPill key={s} label={s} active={sizes.includes(s)} onClick={() => toggleSize(s)} />
                ))}
              </div>
            </div>

            {/* Concentration */}
            <div>
              <FieldLabel>Concentration <OptionalTag /></FieldLabel>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <TabPill key={t} label={t} active={type === t} onClick={() => setType(type === t ? "" : t)} />
                ))}
              </div>
            </div>

            {/* Purchase Month + Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Purchase Month <OptionalTag /></FieldLabel>
                <Select options={MONTH_OPTIONS} value={purchaseMonth} onChange={setPurchaseMonth} />
              </div>
              <div>
                <FieldLabel>Purchase Year <OptionalTag /></FieldLabel>
                <Select options={YEAR_OPTIONS} value={purchaseYear} onChange={setPurchaseYear} />
              </div>
            </div>

            {/* Purchase Price + Where Bought */}
            <div className="flex flex-col gap-2">
              <FieldLabel>Purchase Details <OptionalTag /></FieldLabel>
              <input
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Price (e.g. $120)"
                className={inputCls}
                style={{ ...inputStyle, color: purchasePrice ? "var(--color-navy)" : "var(--color-meta-text)" }}
              />
              <input
                value={whereBought}
                onChange={(e) => setWhereBought(e.target.value)}
                placeholder="Where bought (Sephora, online, etc.)"
                className={inputCls}
                style={{ ...inputStyle, color: whereBought ? "var(--color-navy)" : "var(--color-meta-text)" }}
              />
            </div>

            {/* Personal Notes */}
            <div>
              <FieldLabel>Personal Notes <OptionalTag /></FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Your impressions, context, memories..."
                rows={3}
                className="w-full p-[var(--space-3)] rounded-[var(--radius-sm)] font-sans outline-none transition-[border-color] duration-150 focus:border-[var(--color-accent)] resize-none placeholder:text-[var(--color-navy-mid)] [letter-spacing:var(--tracking-sm)]"
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 400,
                  minHeight: "var(--size-row-min)",
                  background: "var(--color-cream)",
                  border: "1px solid var(--color-meta-text)",
                  color: notes ? "var(--color-navy)" : "var(--color-meta-text)",
                }}
              />
            </div>

            {/* Compliments */}
            <div>
              <FieldLabel>Compliments</FieldLabel>
              <p
                className="font-sans"
                style={{ fontSize: "13px", color: "rgba(30,45,69,0.8)", marginBottom: "var(--space-2)" }}
              >
                {fragCompliments.length > 0 ? `${fragCompliments.length} logged` : "None logged yet"}
              </p>
              <Button variant="secondary" size="sm" onClick={() => setCompFormOpen(true)}>
                Log Compliment
              </Button>
            </div>

            {err && (
              <p className="font-sans" style={{ fontSize: "13px", color: "var(--color-destructive)" }}>
                {err}
              </p>
            )}
          </div>
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
          }}
        >
          <div className="flex items-center gap-3">
            {!confirmDelete ? (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                Remove
              </Button>
            ) : (
              <>
                <span className="font-sans" style={{ fontSize: "13px", color: "var(--color-destructive)" }}>
                  Are you sure? This cannot be undone.
                </span>
                <Button variant="destructive" size="sm" onClick={() => frag && onDelete(frag)}>
                  Yes, Remove
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={saving || confirmDelete}>
              {saving ? <><Spinner /> Saving...</> : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
