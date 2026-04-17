"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabPill } from "@/components/ui/tab-pill";
import { Search, Plus, Flag } from "@/components/ui/Icons";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { submitCommunityFlag } from "@/lib/data/mutations";
import { WISHLIST_PRIORITY_LABELS, type WishlistPriority } from "@/types";
import type { UserFragrance, FragranceType, CommunityFrag } from "@/types";

// ── Constants ──────────────────────────────────────────────

const PRIORITY_KEYS: WishlistPriority[] = ["HIGH", "MEDIUM", "LOW"];

const PRIORITY_TOOLTIPS: Record<WishlistPriority, string> = {
  HIGH: "Obsessed and need to own this",
  MEDIUM: "Really really good",
  LOW: "Don't want to forget it",
};

const CONCENTRATION_OPTIONS = [
  { value: "Parfum", label: "Parfum" },
  { value: "Extrait de Parfum", label: "Extrait de Parfum" },
  { value: "Eau de Parfum", label: "Eau de Parfum" },
  { value: "Eau de Toilette", label: "Eau de Toilette" },
  { value: "Eau de Cologne", label: "Eau de Cologne" },
  { value: "Eau Fraiche", label: "Eau Fraiche" },
  { value: "Body Spray", label: "Body Spray" },
  { value: "Hair Mist", label: "Hair Mist" },
  { value: "Solid", label: "Solid" },
];

const normStr = (s: string) => (s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

function genId(): string {
  return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Sub-components ─────────────────────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group relative inline-block">
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-150"
        style={{
          background: "var(--color-navy)",
          color: "var(--color-cream)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-1) var(--space-2)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          zIndex: 100,
        }}
      >
        {text}
      </span>
    </span>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--color-row-divider)" }} />;
}

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-xs)",
  color: "var(--color-meta-text)",
  textTransform: "uppercase",
  letterSpacing: "var(--tracking-wide)",
  marginBottom: "var(--space-2)",
};

const sectionPad: React.CSSProperties = {
  padding: "var(--space-6)",
};

// ── Main component ─────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<{ name: string; house: string; fragranceId: string; type: string }>;
}

export function AddToWishlistModal({ open, onClose, prefill }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const { communityFrags, addFrag } = useData();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommunityFrag[]>([]);
  const [selected, setSelected] = useState<CommunityFrag | null>(null);
  const [showNoResults, setShowNoResults] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const [qaName, setQaName] = useState("");
  const [qaHouse, setQaHouse] = useState("");
  const [qaConcentration, setQaConcentration] = useState("");

  const [priority, setPriority] = useState<WishlistPriority | null>(null);
  const [concentration, setConcentration] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(prefill?.name ?? "");
    setResults([]);
    setSelected(null);
    setShowNoResults(false);
    setShowQuickAdd(false);
    setQaName("");
    setQaHouse("");
    setQaConcentration("");
    setPriority(null);
    setConcentration(prefill?.type ?? "");
    setNotes("");
    setSaving(false);
  }, [open, prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) {
      setResults([]);
      setShowNoResults(false);
      return;
    }
    const hits = communityFrags
      .filter(
        (f) =>
          f.fragranceName.toLowerCase().includes(q) ||
          f.fragranceHouse.toLowerCase().includes(q),
      )
      .slice(0, 8);
    setResults(hits);
    setShowNoResults(hits.length === 0);
  }, [query, communityFrags]);

  function handleQueryChange(val: string) {
    setQuery(val);
    if (selected && val !== selected.fragranceName) {
      setSelected(null);
      setConcentration("");
    }
  }

  function selectResult(f: CommunityFrag) {
    setSelected(f);
    setQuery(f.fragranceName);
    setResults([]);
    setShowNoResults(false);
    setShowQuickAdd(false);
    setConcentration(f.fragranceType ?? "");
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setConcentration("");
  }

  // Concentrations available in DB for selected fragrance
  const availableConcentrations: string[] = selected
    ? Array.from(
        new Set(
          communityFrags
            .filter(
              (f) =>
                normStr(f.fragranceName) === normStr(selected.fragranceName) &&
                normStr(f.fragranceHouse) === normStr(selected.fragranceHouse),
            )
            .map((f) => f.fragranceType)
            .filter(Boolean),
        ),
      )
    : [];

  const filteredConcentrationOptions =
    availableConcentrations.length > 0
      ? CONCENTRATION_OPTIONS.filter((o) => availableConcentrations.includes(o.value))
      : CONCENTRATION_OPTIONS;

  const concentrationNotInDb =
    !!selected &&
    !!concentration &&
    availableConcentrations.length > 0 &&
    !availableConcentrations.includes(concentration);

  const showResults = !selected && results.length > 0 && query.trim().length >= 2;
  const canSave = query.trim().length > 0 && !showQuickAdd;

  async function handleSave() {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const frag: UserFragrance = {
        id: genId(),
        fragranceId: selected?.fragranceId ?? null,
        userId: user.id,
        name: selected?.fragranceName ?? query.trim(),
        house: selected?.fragranceHouse ?? "",
        status: "WANT_TO_BUY",
        sizes: [],
        type: (concentration as FragranceType) || null,
        personalRating: null,
        statusRating: null,
        whereBought: null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: null,
        isDupe: false,
        dupeFor: "",
        personalNotes: notes.trim(),
        createdAt: new Date().toISOString(),
        wishlistPriority: priority,
      };
      await addFrag(frag);
      if (concentrationNotInDb) {
        submitCommunityFlag({
          userId: user.id,
          fragranceId: selected?.fragranceId ?? null,
          fragranceName: frag.name,
          fragranceHouse: frag.house,
          fieldFlagged: "concentration",
          userNote: `User added "${concentration}" which is not in the database for this fragrance.`,
        }).catch(() => {});
      }
      toast("Added to wishlist", "success");
      onClose();
    } catch {
      toast("Could not save - try again", "error");
    }
    setSaving(false);
  }

  async function handleQuickAdd() {
    if (!user || !qaName.trim()) return;
    setSaving(true);
    try {
      const frag: UserFragrance = {
        id: genId(),
        fragranceId: null,
        userId: user.id,
        name: qaName.trim(),
        house: qaHouse.trim(),
        status: "WANT_TO_BUY",
        sizes: [],
        type: (qaConcentration as FragranceType) || null,
        personalRating: null,
        statusRating: null,
        whereBought: null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: null,
        isDupe: false,
        dupeFor: "",
        personalNotes: notes.trim(),
        createdAt: new Date().toISOString(),
        wishlistPriority: priority,
      };
      await addFrag(frag);
      await submitCommunityFlag({
        userId: user.id,
        fragranceId: null,
        fragranceName: qaName.trim(),
        fragranceHouse: qaHouse.trim(),
        fieldFlagged: "new_fragrance",
        userNote: `Manual wishlist add: "${qaName.trim()}" by "${qaHouse.trim()}"${qaConcentration ? `, ${qaConcentration}` : ""}. Pending review.`,
      });
      toast("Added to wishlist", "success");
      onClose();
    } catch {
      toast("Could not save - try again", "error");
    }
    setSaving(false);
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-[520px]">
      <ModalHeader title="Add to Wishlist" onClose={onClose} />

      <div>
        {/* Section 1 — Fragrance search */}
        <div style={sectionPad}>
          <div ref={searchRef} style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-meta-text)" }}
              />
              <input
                value={query}
                readOnly={!!selected}
                onChange={(e) => handleQueryChange(e.target.value)}
                onBlur={() => setTimeout(() => setResults([]), 150)}
                placeholder="Search your collection..."
                autoFocus
                className="w-full h-10 pl-9 pr-9 font-sans outline-none transition-[border-color] duration-150 focus:border-[var(--color-accent)]"
                style={{
                  fontSize: "var(--text-sm)",
                  letterSpacing: "var(--tracking-xs)",
                  background: "var(--color-cream)",
                  border: "1px solid var(--color-meta-text)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-navy)",
                }}
              />
              {selected && (
                <button
                  onClick={clearSelection}
                  aria-label="Clear selection"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-1 leading-none"
                  style={{ color: "var(--color-meta-text)", fontSize: "var(--text-lg)" }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Results dropdown */}
            {showResults && (
              <div
                role="listbox"
                className="absolute left-0 right-0 z-50 overflow-y-auto"
                style={{
                  top: "calc(100% + var(--space-1))",
                  background: "var(--color-cream)",
                  border: "1px solid var(--color-meta-text)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  maxHeight: "240px",
                }}
              >
                {results.map((f) => (
                  <div
                    key={f.fragranceId}
                    role="option"
                    aria-selected={false}
                    onMouseDown={() => selectResult(f)}
                    className="cursor-pointer transition-colors last:border-0"
                    style={{
                      height: "var(--size-row-min)",
                      padding: "0 var(--space-4)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      borderBottom: "1px solid var(--color-row-divider)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-row-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontStyle: "italic",
                          fontSize: "var(--text-note)",
                          color: "var(--color-navy)",
                          lineHeight: "var(--leading-tight)",
                        }}
                      >
                        {f.fragranceName}
                      </span>
                      {f.fragranceType && (
                        <span
                          style={{
                            fontFamily: "var(--font-sans)",
                            fontSize: "var(--text-xs)",
                            color: "var(--color-meta-text)",
                          }}
                        >
                          {f.fragranceType}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-sans)",
                        textTransform: "uppercase",
                        fontSize: "var(--text-label)",
                        color: "var(--color-meta-text)",
                        letterSpacing: "var(--tracking-wide)",
                      }}
                    >
                      {f.fragranceHouse}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No-results actions */}
            {showNoResults && !showQuickAdd && (
              <div style={{ marginTop: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                <Button
                  variant="ghost"
                  onClick={() => { onClose(); router.push("/import"); }}
                  style={{ justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Flag size={14} />
                  Not finding it? Import from Fragrantica
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowQuickAdd(true); setQaName(query); }}
                  style={{ justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Plus size={14} />
                  Quick add manually
                </Button>
              </div>
            )}

            {/* Quick-add inline form */}
            {showQuickAdd && (
              <div
                style={{
                  marginTop: "var(--space-3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                  background: "var(--color-cream-dark)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-4)",
                }}
              >
                <Input
                  value={qaName}
                  onChange={(e) => setQaName(e.target.value)}
                  placeholder="Fragrance Name"
                />
                <Input
                  value={qaHouse}
                  onChange={(e) => setQaHouse(e.target.value)}
                  placeholder="House"
                />
                <Select
                  options={CONCENTRATION_OPTIONS}
                  value={qaConcentration}
                  onChange={setQaConcentration}
                  placeholder="Concentration"
                />
                <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                  <Button variant="ghost" onClick={() => setShowQuickAdd(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleQuickAdd}
                    disabled={!qaName.trim() || saving}
                  >
                    {saving ? "Saving..." : "Add to Wishlist"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* Section 2 — Priority */}
        <div style={sectionPad}>
          <div style={sectionLabelStyle}>Priority</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {PRIORITY_KEYS.map((p) => (
              <Tooltip key={p} text={PRIORITY_TOOLTIPS[p]}>
                <TabPill
                  label={WISHLIST_PRIORITY_LABELS[p].label}
                  active={priority === p}
                  onClick={() => setPriority(priority === p ? null : p)}
                />
              </Tooltip>
            ))}
          </div>
        </div>

        <Divider />

        {/* Section 3 — Concentration */}
        <div style={sectionPad}>
          <div style={sectionLabelStyle}>Concentration</div>
          <Select
            options={filteredConcentrationOptions}
            value={concentration}
            onChange={setConcentration}
            placeholder="Select concentration"
          />
          {concentrationNotInDb && (
            <div
              style={{
                marginTop: "var(--space-2)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xs)",
                color: "var(--color-meta-text)",
              }}
            >
              This concentration isn&apos;t in our database yet — it will be added as a pending entry for review.
            </div>
          )}
        </div>

        <Divider />

        {/* Section 4 — Notes */}
        <div style={sectionPad}>
          <div style={sectionLabelStyle}>Notes</div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context, reaction, moment..."
            rows={3}
            maxLength={160}
          />
        </div>
      </div>

      <ModalFooter className="justify-between">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? "Saving..." : "Add to Wishlist"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
