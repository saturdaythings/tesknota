"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import type {
  FragranceStatus,
  CommunityFrag,
  FragranceType,
  BottleSize,
  UserFragrance,
} from "@/types";
import { MONTHS } from "@/lib/frag-utils";

function genId(): string {
  return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const STATUS_OPTIONS = [
  { value: "CURRENT", label: "Current Collection" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "DONT_LIKE", label: "Have Smelled — Don't Like" },
  { value: "FINISHED", label: "Finished (Empty Bottle)" },
  { value: "WANT_TO_IDENTIFY", label: "Save to Identify Later" },
];

const SIZE_OPTIONS: { label: string; value: BottleSize }[] = [
  { label: "Sample", value: "Sample" },
  { label: "Travel", value: "Travel" },
  { label: "Full Bottle", value: "Full Bottle" },
  { label: "Decant", value: "Decant" },
];

const TYPE_OPTIONS = [
  { value: "Extrait de Parfum", label: "Extrait de Parfum" },
  { value: "Eau de Parfum", label: "Eau de Parfum" },
  { value: "Eau de Toilette", label: "Eau de Toilette" },
  { value: "Cologne", label: "Cologne" },
  { value: "Perfume Concentré", label: "Perfume Concentré" },
  { value: "Perfume Oil", label: "Perfume Oil" },
  { value: "Body Spray", label: "Body Spray" },
  { value: "Other", label: "Other" },
];

const WHERE_BOUGHT_OPTIONS = [
  { value: "Sephora", label: "Sephora" },
  { value: "Ulta", label: "Ulta" },
  { value: "Department Store", label: "Department Store" },
  { value: "Online", label: "Online" },
  { value: "Boutique", label: "Boutique" },
  { value: "Other", label: "Other" },
];

const MONTH_OPTIONS = [
  { value: "", label: "—" },
  ...MONTHS.map((m, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: m,
  })),
];

const YEAR_OPTIONS = [
  { value: "", label: "—" },
  ...Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) =>
    String(new Date().getFullYear() - i),
  ).map((y) => ({ value: y, label: y })),
];

const RATING_LABELS = [
  "",
  "1 star",
  "2 stars",
  "3 stars",
  "4 stars",
  "5 stars",
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStatus?: FragranceStatus;
  initialName?: string;
}

function FragResultCard({
  frag,
  onClick,
}: {
  frag: CommunityFrag;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-cream-dark)",
        padding: "var(--space-4)",
        marginBottom: "var(--space-2)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "var(--text-lg)",
          fontStyle: "italic",
          color: "var(--color-navy)",
          marginBottom: "var(--space-1)",
        }}
      >
        {frag.fragranceName}
      </div>
      <FieldLabel className="mb-[var(--space-2)]">
        {frag.fragranceHouse}
      </FieldLabel>
      <div
        style={{
          borderTop: "1px solid var(--color-row-divider)",
          paddingTop: "var(--space-2)",
          marginBottom: "var(--space-2)",
        }}
      />
      <FieldLabel>Avg Price</FieldLabel>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-base)",
          color: "var(--color-navy)",
          fontWeight: "bold",
          marginBottom: "var(--space-2)",
        }}
      >
        {frag.avgPrice ?? "N/A"}
      </div>
      {frag.fragranceAccords && frag.fragranceAccords.length > 0 && (
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--text-note)",
            fontStyle: "italic",
            color: "var(--color-navy)",
          }}
        >
          {frag.fragranceAccords.join(", ")}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const colors1 =
    step === 1
      ? ["var(--color-navy)", "var(--color-cream-dark)"]
      : ["var(--color-success)", "var(--color-navy)"];
  const labels = [
    "STEP 1 OF 2 — SEARCH & IDENTIFY",
    "STEP 2 OF 2 — PERSONAL DETAILS",
  ];

  return (
    <div>
      <div style={{ marginBottom: "var(--space-2)" }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-xs)",
            color: "var(--color-meta-text)",
            textTransform: "uppercase",
            letterSpacing: "var(--tracking-wide)",
          }}
        >
          {labels[step - 1]}
        </span>
      </div>
      <div
        style={{
          borderBottom: "1px solid var(--color-cream-dark)",
          marginBottom: "var(--space-3)",
        }}
      />
      <div
        style={{
          display: "flex",
          height: "var(--space-1)",
          marginBottom: "var(--space-4)",
        }}
      >
        <div style={{ flex: 1, background: colors1[0] }} />
        <div style={{ flex: 1, background: colors1[1] }} />
      </div>
    </div>
  );
}

export function AddFragranceModal({
  open,
  onClose,
  defaultStatus,
  initialName,
}: Props) {
  const { user } = useUser();
  const { communityFrags, addFrag } = useData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<CommunityFrag[]>([]);
  const [selected, setSelected] = useState<CommunityFrag | null>(null);
  const [status, setStatus] = useState<FragranceStatus>(
    defaultStatus ?? "CURRENT",
  );

  // Step 2 state
  const [sizes, setSizes] = useState<BottleSize[]>([]);
  const [fragType, setFragType] = useState<FragranceType | "">("");
  const [price, setPrice] = useState("");
  const [whereBought, setWhereBought] = useState("");
  const [rating, setRating] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [purchaseMonth, setPurchaseMonth] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [isDupe, setIsDupe] = useState(false);
  const [dupeFor, setDupeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [customWhereBoughtOptions, setCustomWhereBoughtOptions] = useState<
    string[]
  >([]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setQuery(initialName ?? "");
    setDebouncedQuery(initialName ?? "");
    setResults([]);
    setSelected(null);
    setStatus(defaultStatus ?? "CURRENT");
    setSizes([]);
    setFragType("");
    setPrice("");
    setWhereBought("");
    setRating(0);
    setShowDetails(false);
    setPurchaseMonth("");
    setPurchaseYear("");
    setIsDupe(false);
    setDupeFor("");
    setNotes("");
  }, [open, defaultStatus, initialName]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

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
      .slice(0, 8);
    setResults(matches);
  }, [debouncedQuery, communityFrags]);

  function handleSelect(frag: CommunityFrag) {
    setSelected(frag);
    setQuery(frag.fragranceName);
    setResults([]);
  }

  function handleNext() {
    setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  async function handleSave() {
    if (!user || saving) return;
    const name = selected?.fragranceName ?? query.trim();
    const house = selected?.fragranceHouse ?? "";
    if (!name) {
      toast("Enter a fragrance name first", "error");
      return;
    }
    setSaving(true);
    try {
      const newFrag: UserFragrance = {
        id: genId(),
        fragranceId: selected?.fragranceId ?? null,
        userId: user.id,
        name,
        house,
        status,
        sizes,
        type: (fragType as FragranceType) || null,
        personalRating: rating || null,
        statusRating: null,
        whereBought: whereBought || null,
        purchaseDate: null,
        purchaseMonth: purchaseMonth || null,
        purchaseYear: purchaseYear || null,
        purchasePrice: price.trim() || null,
        isDupe,
        dupeFor: dupeFor.trim(),
        personalNotes: notes.trim(),
        createdAt: new Date().toISOString(),
        wishlistPriority: null,
      };
      await addFrag(newFrag);
      toast(name + " added to your collection", "success");
      onClose();
    } catch {
      toast("Failed to save. Check your connection.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const showResults = results.length > 0 && !selected;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--space-6)",
          borderBottom: "1px solid var(--color-cream-dark)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "var(--space-3)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "var(--text-empty-title)",
              fontStyle: "italic",
              color: "var(--color-navy)",
            }}
          >
            Add Fragrance
          </div>
          <Button
            variant="icon"
            onClick={onClose}
            style={{ color: "var(--color-meta-text)" }}
          >
            <X size={18} />
          </Button>
        </div>
        <ProgressBar step={step} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
        {step === 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-6)",
            }}
          >
            {/* Search field */}
            <div>
              <FieldLabel className="mb-[var(--space-3)]">
                Search Fragrance Name
              </FieldLabel>
              <div style={{ position: "relative" }}>
                <Input
                  variant="underline"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (selected) setSelected(null);
                  }}
                  placeholder="e.g. Baccarat Rouge 540"
                />
                {showResults && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      marginTop: "var(--space-2)",
                    }}
                  >
                    {results.map((f) => (
                      <FragResultCard
                        key={f.fragranceId}
                        frag={f}
                        onClick={() => handleSelect(f)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status field */}
            <div>
              <FieldLabel className="mb-[var(--space-3)]">Status</FieldLabel>
              <Select
                options={STATUS_OPTIONS}
                value={status}
                onChange={(v) => setStatus(v as FragranceStatus)}
                placeholder="Select status"
                size="auto"
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-6)",
            }}
          >
            {/* Two-column: SIZE OWNED + TYPE */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-6)",
              }}
            >
              {/* Size Owned */}
              <div>
                <FieldLabel className="mb-[var(--space-3)]">
                  Size Owned
                </FieldLabel>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--space-2)",
                  }}
                >
                  {SIZE_OPTIONS.map((s) => {
                    const isActive = sizes.includes(s.value);
                    return (
                      <Button
                        key={s.value}
                        variant="toggle"
                        active={isActive}
                        onClick={() =>
                          setSizes(
                            isActive
                              ? sizes.filter((x) => x !== s.value)
                              : [...sizes, s.value],
                          )
                        }
                      >
                        {s.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Type */}
              <div>
                <FieldLabel className="mb-[var(--space-3)]">Type</FieldLabel>
                <Select
                  options={TYPE_OPTIONS}
                  value={fragType}
                  onChange={(v) => setFragType(v as FragranceType | "")}
                  placeholder="Select type"
                  size="auto"
                />
              </div>
            </div>

            {/* Two-column: PURCHASE PRICE + WHERE BOUGHT */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-6)",
              }}
            >
              {/* Purchase Price */}
              <div>
                <FieldLabel className="mb-[var(--space-3)]">
                  Purchase Price ($)
                </FieldLabel>
                <Input
                  variant="underline"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 136.34"
                />
              </div>

              {/* Where Bought */}
              <div>
                <FieldLabel className="mb-[var(--space-3)]">
                  Where Bought
                </FieldLabel>
                <SearchableSelect
                  options={WHERE_BOUGHT_OPTIONS}
                  value={whereBought}
                  onChange={setWhereBought}
                  placeholder="Select retailer"
                  allowCustom
                  customOptions={customWhereBoughtOptions}
                  onCustomAdd={(v) =>
                    setCustomWhereBoughtOptions((prev) => [...prev, v])
                  }
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <FieldLabel className="mb-[var(--space-2)]">Rating</FieldLabel>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-1)",
                  marginBottom: "var(--space-1)",
                }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    variant="ghost"
                    onClick={() => setRating(rating === n ? 0 : n)}
                    style={{
                      fontSize: "var(--text-lg)",
                      padding: "var(--space-half) var(--space-1)",
                      height: "auto",
                    }}
                  >
                    {n <= rating ? "★" : "☆"}
                  </Button>
                ))}
              </div>
              {rating > 0 && (
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--text-xs)",
                    color: "var(--color-meta-text)",
                  }}
                >
                  {RATING_LABELS[rating]}
                </div>
              )}
            </div>

            {/* More Details toggle */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="h-auto p-0 uppercase text-[length:var(--text-xs)] [letter-spacing:var(--tracking-wide)]"
              >
                {showDetails ? "— Less Details" : "— More Details"}
              </Button>

              {showDetails && (
                <div
                  style={{
                    marginTop: "var(--space-3)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "var(--space-3)",
                  }}
                >
                  <div style={{ gridColumn: "1 / 2" }}>
                    <FieldLabel className="mb-[var(--space-2)]">
                      Purchase Date
                    </FieldLabel>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <Select
                        options={MONTH_OPTIONS}
                        value={purchaseMonth}
                        onChange={setPurchaseMonth}
                        placeholder="Month"
                        size="auto"
                      />
                      <Select
                        options={YEAR_OPTIONS}
                        value={purchaseYear}
                        onChange={setPurchaseYear}
                        placeholder="Year"
                        size="auto"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dupe Tracking */}
            <div>
              <FieldLabel className="mb-[var(--space-2)]">
                Dupe Tracking
              </FieldLabel>
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  alignItems: "center",
                }}
              >
                <Button
                  variant="toggle"
                  active={isDupe}
                  onClick={() => setIsDupe(true)}
                >
                  Dupe For
                </Button>
                <Button
                  variant="toggle"
                  active={!isDupe}
                  onClick={() => {
                    setIsDupe(false);
                    setDupeFor("");
                  }}
                >
                  Not a Dupe
                </Button>
                {isDupe && (
                  <div style={{ flex: 1 }}>
                    <Input
                      variant="underline"
                      value={dupeFor}
                      onChange={(e) => setDupeFor(e.target.value)}
                      placeholder="Search collection..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Personal Notes */}
            <div>
              <FieldLabel className="mb-[var(--space-3)]">
                Personal Notes
              </FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How does it smell on your skin? When do you wear it? Any context worth remembering?"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--color-cream-dark)",
          padding: "var(--space-4) var(--space-6)",
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-3)",
        }}
      >
        {step === 1 && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Fragrance"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
