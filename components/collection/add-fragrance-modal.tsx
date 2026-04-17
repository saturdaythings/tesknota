"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import type { UserFragrance, FragranceStatus, FragranceType, BottleSize, CommunityFrag } from "@/types";

// ── Constants ─────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "CURRENT", label: "Current Collection" },
  { value: "WANT_TO_BUY", label: "Wishlist" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "DONT_LIKE", label: "Have Smelled — Don't Like" },
  { value: "FINISHED", label: "Finished (Empty Bottle)" },
  { value: "WANT_TO_IDENTIFY", label: "Save to Identify Later" },
];

const TYPE_OPTIONS = [
  { value: "Extrait de Parfum", label: "Extrait / Parfum" },
  { value: "Eau de Parfum", label: "EDP" },
  { value: "Eau de Toilette", label: "EDT" },
  { value: "Cologne", label: "EDC" },
  { value: "Perfume Concentré", label: "Concentré" },
  { value: "Perfume Oil", label: "Oil" },
  { value: "Body Spray", label: "Body Spray" },
  { value: "Other", label: "Other" },
];

const STEP_LABELS = [
  "Step 1 of 3 — Search & Identify",
  "Step 2 of 3 — Status & Details",
  "Step 3 of 3 — Purchase & Personal",
];

function genId(): string {
  return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Step dots ─────────────────────────────────────────────

function StepDots({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          alignItems: "center",
          marginBottom: "var(--space-2)",
        }}
      >
        {[1, 2, 3].map((n) => {
          const completed = n < step;
          const active = n === step;
          return (
            <div
              key={n}
              style={{
                width: 8,
                height: 8,
                borderRadius: "var(--radius-full)",
                background:
                  completed || active
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background var(--transition-base)",
              }}
            >
              {completed && (
                <Check
                  size={5}
                  strokeWidth={3}
                  style={{ color: "white" }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      <span
        className="text-meta"
        style={{ color: "var(--color-text-muted)" }}
      >
        {STEP_LABELS[step - 1]}
      </span>
    </div>
  );
}

// ── Star rating ────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div>
      <div className="text-label" style={{ marginBottom: "var(--space-1)" }}>
        My Rating
      </div>
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= (hover || value);
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n !== 1 ? "s" : ""}`}
              onClick={() => onChange(value === n ? 0 : n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              style={{
                fontSize: 22,
                lineHeight: 1,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: filled ? "var(--color-accent)" : "var(--color-border)",
                transition: "color var(--transition-base)",
              }}
            >
              {filled ? "\u2605" : "\u2606"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStatus?: FragranceStatus;
}

export function AddFragranceModal({ open, onClose, defaultStatus }: Props) {
  const { user } = useUser();
  const { communityFrags, addFrag } = useData();
  const { toast } = useToast();

  // Step
  const [step, setStep] = useState(1);

  // Step 1
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<CommunityFrag[]>([]);
  const [selected, setSelected] = useState<CommunityFrag | null>(null);
  const [identifyLater, setIdentifyLater] = useState(false);
  const [step1Error, setStep1Error] = useState("");
  const [searchKey, setSearchKey] = useState(0);

  // Step 2
  const [status, setStatus] = useState<FragranceStatus>("CURRENT");
  const [sizeInput, setSizeInput] = useState("");
  const [fragType, setFragType] = useState<FragranceType | "">("");

  // Step 3
  const [rating, setRating] = useState(0);
  const [price, setPrice] = useState("");
  const [whereBought, setWhereBought] = useState("");
  const [dateAdded, setDateAdded] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setSelected(null);
    setIdentifyLater(false);
    setStep1Error("");
    setStatus(defaultStatus ?? "CURRENT");
    setSizeInput("");
    setFragType("");
    setRating(0);
    setPrice("");
    setWhereBought("");
    setDateAdded(todayIso());
    setNotes("");
    setSaving(false);
    setSearchKey((k) => k + 1);
  }, [open, defaultStatus]);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Filter community frags
  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    const matches = communityFrags
      .filter(
        (f) =>
          f.fragranceName.toLowerCase().includes(q) ||
          f.fragranceHouse.toLowerCase().includes(q),
      )
      .slice(0, 12);
    setResults(matches);
  }, [debouncedQuery, communityFrags]);

  function selectResult(frag: CommunityFrag) {
    setSelected(frag);
    setQuery(frag.fragranceName);
    setResults([]);
    setStep1Error("");
  }

  function handleIdentifyLater() {
    setIdentifyLater(true);
    setSelected(null);
    setStatus("WANT_TO_IDENTIFY");
    setStep(3);
  }

  const canAdvance1 = selected !== null || identifyLater;

  function next() {
    if (step === 1) {
      if (!canAdvance1) {
        setStep1Error("Select a fragrance to continue.");
        return;
      }
      setStep1Error("");
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  function back() {
    if (step === 3 && identifyLater) {
      setIdentifyLater(false);
      setStep(1);
    } else {
      setStep((s) => s - 1);
    }
  }

  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (selected && val !== selected.fragranceName) {
      setSelected(null);
    }
    setIdentifyLater(false);
  }, [selected]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const frag: UserFragrance = {
        id: genId(),
        fragranceId: selected?.fragranceId ?? null,
        userId: user.id,
        name: selected?.fragranceName ?? "Unidentified Fragrance",
        house: selected?.fragranceHouse ?? "",
        status,
        sizes: sizeInput.trim() ? [sizeInput.trim() as BottleSize] : [],
        type: fragType || null,
        personalRating: rating || null,
        statusRating: null,
        whereBought: whereBought.trim() || null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: price.trim() ? `$${price.trim()}` : null,
        isDupe: false,
        dupeFor: "",
        personalNotes: notes.trim(),
        createdAt: dateAdded
          ? new Date(dateAdded).toISOString()
          : new Date().toISOString(),
        wishlistPriority: null,
      };
      await addFrag(frag);
      toast("Fragrance added to your collection", "success");
      onClose();
    } catch (e) {
      console.error(e);
      toast("Failed to save. Check your connection.", "error");
    } finally {
      setSaving(false);
    }
  }

  const showResults = results.length > 0 && !selected;
  const showNoResults =
    debouncedQuery.trim().length >= 2 && results.length === 0 && !selected && !identifyLater;

  return (
    <Modal open={open} onClose={onClose} className="max-w-[560px]">
      <ModalHeader
        title="Add Fragrance"
        onClose={onClose}
      />
      <ModalBody>
        <StepDots step={step} />

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div>
            <h3 className="text-subheading" style={{ marginBottom: "var(--space-4)" }}>
              Find a Fragrance
            </h3>

            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <SearchInput
                  key={searchKey}
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search by name or brand..."
                  autoFocus
                  style={{ width: "100%" }}
                />
                {selected && (
                  <span
                    aria-label="Selected"
                    style={{
                      position: "absolute",
                      right: "40px",
                      display: "flex",
                      alignItems: "center",
                      color: "var(--color-success)",
                      pointerEvents: "none",
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                )}
              </div>

              {/* Results panel */}
              {showResults && (
                <div
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-surface)",
                    boxShadow: "var(--shadow-md)",
                    maxHeight: 240,
                    overflowY: "auto",
                    marginTop: "var(--space-2)",
                    position: "absolute",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                  }}
                  role="listbox"
                  aria-label="Search results"
                >
                  {results.map((f) => (
                    <div
                      key={f.fragranceId}
                      role="option"
                      aria-selected={false}
                      onClick={() => selectResult(f)}
                      onKeyDown={(e) => e.key === "Enter" && selectResult(f)}
                      tabIndex={0}
                      style={{
                        height: 52,
                        padding: "0 var(--space-4)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--color-border)",
                        transition: "background var(--transition-base)",
                      }}
                      className="hover:bg-[var(--color-surface-raised)] focus:bg-[var(--color-surface-raised)] focus:outline-none last:border-b-0"
                    >
                      <div
                        className="text-body"
                        style={{ fontWeight: 500 }}
                      >
                        {f.fragranceName}
                      </div>
                      <div className="text-secondary">{f.fragranceHouse}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* No results */}
            {showNoResults && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <span className="text-secondary">
                  Not finding it? Save to identify later.
                </span>
                <Button variant="ghost" size="sm" onClick={handleIdentifyLater}>
                  Save to Identify Later
                </Button>
              </div>
            )}

            {/* Inline error */}
            {step1Error && (
              <p
                role="alert"
                style={{
                  marginTop: "var(--space-2)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-danger)",
                }}
              >
                {step1Error}
              </p>
            )}
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div>
            <h3 className="text-subheading" style={{ marginBottom: "var(--space-4)" }}>
              Add to Your Collection
            </h3>

            {/* Selected frag summary */}
            {selected && (
              <div
                style={{
                  background: "var(--color-surface-raised)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3) var(--space-4)",
                  marginBottom: "var(--space-5)",
                }}
              >
                <div className="text-body" style={{ fontWeight: 500 }}>
                  {selected.fragranceName}
                </div>
                <div className="text-secondary">{selected.fragranceHouse}</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => setStatus(v as FragranceStatus)}
                placeholder="Select status"
              />
              <Input
                label="Size Owned"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="e.g. 50ml, travel size"
              />
              <Select
                label="Type"
                options={TYPE_OPTIONS}
                value={fragType}
                onChange={(v) => setFragType(v as FragranceType | "")}
                placeholder="Select type"
              />
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div>
            <h3 className="text-subheading" style={{ marginBottom: "var(--space-2)" }}>
              Purchase & Notes
            </h3>
            <p className="text-secondary" style={{ marginBottom: "var(--space-5)" }}>
              Optional — you can always add these later.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <StarRating value={rating} onChange={setRating} />

              {/* Price with $ prefix */}
              <div style={{ position: "relative" }}>
                <Input
                  label="Purchase Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-6"
                />
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    bottom: 0,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--color-navy-mid)",
                    fontSize: "var(--text-base)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  $
                </span>
              </div>

              <Input
                label="Where Bought"
                value={whereBought}
                onChange={(e) => setWhereBought(e.target.value)}
                placeholder="e.g. Sephora, Bloomingdale's"
              />

              <Input
                label="Date Added"
                type="date"
                value={dateAdded}
                onChange={(e) => setDateAdded(e.target.value)}
              />

              <Textarea
                label="Personal Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thoughts, occasions, memories..."
                rows={3}
              />
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step > 1 && (
          <Button variant="ghost" onClick={back} disabled={saving}>
            Back
          </Button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <Button
            variant="primary"
            onClick={next}
            disabled={step === 1 && !canAdvance1}
          >
            Next
          </Button>
        ) : (
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save to Collection"}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
