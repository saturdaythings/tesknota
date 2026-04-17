"use client";

import { useState, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field-label";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import type { UserFragrance, FragranceType, CommunityFrag } from "@/types";

const TYPE_OPTIONS = [
  { value: "", label: "Not sure" },
  { value: "Extrait de Parfum", label: "Extrait / Parfum" },
  { value: "Eau de Parfum", label: "EDP" },
  { value: "Eau de Toilette", label: "EDT" },
  { value: "Cologne", label: "EDC" },
  { value: "Perfume Concentré", label: "Concentré" },
  { value: "Perfume Oil", label: "Oil" },
  { value: "Body Spray", label: "Body Spray" },
  { value: "Other", label: "Other" },
];

function genId(): string {
  return "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<{ name: string; house: string; fragranceId: string; type: string }>;
}

export function AddToWishlistModal({ open, onClose, prefill }: Props) {
  const { user } = useUser();
  const { communityFrags, addFrag } = useData();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<CommunityFrag[]>([]);
  const [selected, setSelected] = useState<CommunityFrag | null>(null);
  const [house, setHouse] = useState("");
  const [fragType, setFragType] = useState<FragranceType | "">("");
  const [saving, setSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setQuery(prefill?.name ?? "");
    setDebouncedQuery(prefill?.name ?? "");
    setHouse(prefill?.house ?? "");
    setFragType((prefill?.type as FragranceType | "") ?? "");
    setSelected(null);
    setResults([]);
    setSaving(false);
  }, [open, prefill]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  // Search community frags
  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q || q.length < 2) { setResults([]); return; }
    const hits = communityFrags
      .filter((f) => f.fragranceName.toLowerCase().includes(q) || f.fragranceHouse.toLowerCase().includes(q))
      .slice(0, 10);
    setResults(hits);
  }, [debouncedQuery, communityFrags]);

  function selectResult(f: CommunityFrag) {
    setSelected(f);
    setQuery(f.fragranceName);
    setHouse(f.fragranceHouse);
    setFragType((f.fragranceType as FragranceType | "") ?? "");
    setResults([]);
  }

  const handleQueryChange = useCallback((val: string) => {
    setQuery(val);
    if (selected && val !== selected.fragranceName) {
      setSelected(null);
      setHouse("");
    }
  }, [selected]);

  const showResults = results.length > 0 && !selected;
  const canSave = query.trim().length > 0;

  async function save() {
    if (!user || !canSave) return;
    setSaving(true);
    try {
      const frag: UserFragrance = {
        id: genId(),
        fragranceId: selected?.fragranceId ?? null,
        userId: user.id,
        name: selected?.fragranceName ?? query.trim(),
        house: house.trim(),
        status: "WANT_TO_BUY",
        sizes: [],
        type: fragType || null,
        personalRating: null,
        statusRating: null,
        whereBought: null,
        purchaseDate: null,
        purchaseMonth: null,
        purchaseYear: null,
        purchasePrice: null,
        isDupe: false,
        dupeFor: "",
        personalNotes: "",
        createdAt: new Date().toISOString(),
      };
      await addFrag(frag);
      toast("Added to wishlist");
      onClose();
    } catch {
      toast("Failed to save. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-[480px]">
      <ModalHeader title="Add to Wishlist" onClose={onClose} />
      <ModalBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

          {/* Fragrance Name with typeahead */}
          <div>
            <FieldLabel>Fragrance Name</FieldLabel>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search by name or brand..."
                  autoFocus
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 36px 0 12px",
                    background: "var(--color-cream)",
                    border: "1.5px solid var(--color-cream-dark)",
                    borderRadius: "3px",
                    fontFamily: "var(--font-sans)",
                    fontSize: "15px",
                    color: "var(--color-navy)",
                    outline: "none",
                  }}
                  className="focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy-mid)]"
                />
                {selected && (
                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--color-accent)",
                      pointerEvents: "none",
                    }}
                  >
                    <Check size={16} />
                  </span>
                )}
              </div>

              {showResults && (
                <div
                  role="listbox"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: "var(--color-cream)",
                    border: "1px solid var(--color-cream-dark)",
                    borderRadius: "3px",
                    boxShadow: "var(--shadow-md)",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {results.map((f) => (
                    <div
                      key={f.fragranceId}
                      role="option"
                      aria-selected={false}
                      onClick={() => selectResult(f)}
                      style={{
                        height: "48px",
                        padding: "0 12px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--color-cream-dark)",
                      }}
                      className="hover:bg-[var(--color-cream-dark)] last:border-0"
                    >
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "14px", fontWeight: 500, color: "var(--color-navy)" }}>
                        {f.fragranceName}
                      </div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "rgba(30,45,69,0.8)" }}>
                        {f.fragranceHouse}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Concentration */}
          <Select
            label="Concentration"
            options={TYPE_OPTIONS}
            value={fragType}
            onChange={(v) => setFragType(v as FragranceType | "")}
            placeholder="Not sure"
          />

          {/* House */}
          <div>
            <FieldLabel>House</FieldLabel>
            <Input
              value={house}
              onChange={(e) => setHouse(e.target.value)}
              placeholder="e.g. Dior, Maison Margiela"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={!canSave || saving}>
          {saving ? "Saving..." : "ADD TO WISHLIST"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
