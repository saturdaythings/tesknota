"use client";

import { useState, useRef, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { MONTHS } from "@/lib/frag-utils";
import { getCommunityData } from "@/lib/data";
import { useToast } from "@/components/ui/toast";
import type { UserFragrance, FragranceStatus, FragranceType, BottleSize } from "@/types";

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

const YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

function genId(): string {
  return "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: "var(--space-2)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--space-2) var(--space-3)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-surface)",
  fontSize: "var(--text-sm)",
  color: "var(--color-text-primary)",
  outline: "none",
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "var(--space-1) var(--space-3)",
    border: "1px solid",
    borderRadius: "var(--radius-sm)",
    fontSize: "var(--text-xs)",
    cursor: "pointer",
    transition: "background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)",
    borderColor: active ? "var(--color-accent)" : "var(--color-border)",
    color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
    background: active ? "var(--color-accent-subtle)" : "transparent",
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: UserFragrance | null;
  forceStatus?: FragranceStatus;
}

export function FragForm({ open, onClose, editing, forceStatus }: Props) {
  const { user } = useUser();
  const { communityFrags, addFrag, editFrag } = useData();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");
  const [selectedFragId, setSelectedFragId] = useState("");
  const [status, setStatus] = useState<FragranceStatus>("CURRENT");

  // Step 2 fields
  const [sizes, setSizes] = useState<BottleSize[]>(["Full Bottle"]);
  const [type, setType] = useState<FragranceType | "">("");
  const [rating, setRating] = useState(0);
  const [whereBought, setWhereBought] = useState("");
  const [purchaseMonth, setPurchaseMonth] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isDupe, setIsDupe] = useState(false);
  const [dupeFor, setDupeFor] = useState("");

  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const isEdit = !!(editing && editing.id);

  // Reset form when opened
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setStep(2);
      setSearch(editing.name);
      setSelectedName(editing.name);
      setSelectedHouse(editing.house);
      setSelectedFragId(editing.fragranceId ?? "");
      setStatus(forceStatus ?? editing.status);
      setSizes(editing.sizes.length ? editing.sizes : ["Full Bottle"]);
      setType(editing.type ?? "");
      setRating(editing.personalRating ?? 0);
      setWhereBought(editing.whereBought ?? "");
      setPurchaseMonth(editing.purchaseMonth ?? "");
      setPurchaseYear(editing.purchaseYear ?? "");
      setPurchasePrice(editing.purchasePrice ?? "");
      setNotes(editing.personalNotes ?? "");
      setIsDupe(editing.isDupe ?? false);
      setDupeFor(editing.dupeFor ?? "");
    } else {
      setStep(1);
      setSearch("");
      setSelectedName("");
      setSelectedHouse("");
      setSelectedFragId("");
      setStatus(forceStatus ?? "CURRENT");
      setSizes(["Full Bottle"]);
      setType("");
      setRating(0);
      setWhereBought("");
      setPurchaseMonth("");
      setPurchaseYear("");
      setPurchasePrice("");
      setNotes("");
      setIsDupe(false);
      setDupeFor("");
    }
    setDropOpen(false);
    setErr("");
    setSaving(false);
    setMoreOpen(isEdit);
  }, [open, editing, forceStatus]);

  const matches = search.trim().length >= 2
    ? communityFrags.filter((cf) =>
        cf.fragranceName.toLowerCase().includes(search.toLowerCase()) ||
        cf.fragranceHouse.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  function selectMatch(cf: typeof communityFrags[0]) {
    setSearch(cf.fragranceName);
    setSelectedName(cf.fragranceName);
    setSelectedHouse(cf.fragranceHouse);
    setSelectedFragId(cf.fragranceId);
    setDropOpen(false);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
    setSelectedName("");
    setSelectedHouse("");
    setSelectedFragId("");
    setDropOpen(val.trim().length >= 2);
  }

  function advanceStep() {
    if (!search.trim()) { setErr("Enter a fragrance name."); return; }
    if (!selectedName) {
      setSelectedName(search.trim());
      setSelectedHouse("");
      setSelectedFragId("");
    }
    setErr("");
    setStep(2);
  }

  function toggleSize(s: BottleSize) {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function save() {
    if (!user) return;
    if (step === 1) { advanceStep(); return; }
    if (!selectedName.trim()) { setErr("Fragrance name required."); return; }

    setSaving(true);
    setErr("");

    const now = new Date().toISOString();
    const frag: UserFragrance = {
      id: editing?.id ?? genId(),
      fragranceId: selectedFragId || editing?.fragranceId || "",
      userId: user.id,
      name: selectedName,
      house: selectedHouse || editing?.house || "",
      status,
      sizes,
      type: type || null,
      personalRating: rating || null,
      statusRating: null,
      whereBought: whereBought.trim() || null,
      purchaseDate: purchaseMonth && purchaseYear ? `${purchaseMonth} ${purchaseYear}` : purchaseYear || null,
      purchaseMonth: purchaseMonth || null,
      purchaseYear: purchaseYear || null,
      purchasePrice: purchasePrice.trim() || null,
      isDupe,
      dupeFor: isDupe ? dupeFor.trim() : "",
      personalNotes: notes.trim(),
      createdAt: editing?.createdAt ?? now,
    };

    try {
      if (isEdit) {
        await editFrag(frag);
        toast("Fragrance updated.");
      } else {
        await addFrag(frag);
        toast("Fragrance added.");
      }
      onClose();
    } catch (e) {
      setErr("Save failed. Check connection.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const cd = selectedName ? getCommunityData(selectedName, selectedHouse, communityFrags) : null;

  const title = isEdit ? "Edit Fragrance" : "Add Fragrance";

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Search */}
          <div>
            <label style={fieldLabel}>Fragrance Name</label>
            <div style={{ position: "relative" }}>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => search.trim().length >= 2 && setDropOpen(true)}
                onBlur={() => setTimeout(() => setDropOpen(false), 150)}
                placeholder="Search by name or house..."
                style={inputStyle}
                className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
              />
              {dropOpen && matches.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 2px)",
                    left: 0,
                    right: 0,
                    zIndex: "var(--z-dropdown)" as unknown as number,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface)",
                    boxShadow: "var(--shadow-md)",
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {matches.map((cf) => (
                    <div
                      key={cf.fragranceId}
                      onMouseDown={() => selectMatch(cf)}
                      style={{
                        padding: "var(--space-2) var(--space-3)",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                      className="last:border-0 hover:bg-[var(--color-surface-raised)]"
                    >
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{cf.fragranceName}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{cf.fragranceHouse}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedName && (
              <div
                style={{
                  marginTop: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)",
                  background: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 500 }}>{selectedName}</div>
                {selectedHouse && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "var(--space-1)" }}>{selectedHouse}</div>
                )}
                {(cd?.avgPrice || cd?.communityRating) && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                    {[cd.avgPrice?.replace(/~/g, ""), cd.communityRating ? cd.communityRating + "/10" : ""].filter(Boolean).join(" · ")}
                  </div>
                )}
                {cd && cd.accords.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginTop: "var(--space-3)" }}>
                    {cd.accords.slice(0, 8).map((a) => (
                      <span
                        key={a}
                        style={{
                          fontSize: "var(--text-xs)",
                          padding: "var(--space-1) var(--space-2)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
                {cd && (cd.topNotes.length > 0 || cd.middleNotes.length > 0 || cd.baseNotes.length > 0) && (
                  <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {cd.topNotes.length > 0 && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        <span style={{ letterSpacing: "0.08em", textTransform: "uppercase", marginRight: "var(--space-2)" }}>Top</span>
                        {cd.topNotes.join(", ")}
                      </div>
                    )}
                    {cd.middleNotes.length > 0 && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        <span style={{ letterSpacing: "0.08em", textTransform: "uppercase", marginRight: "var(--space-2)" }}>Mid</span>
                        {cd.middleNotes.join(", ")}
                      </div>
                    )}
                    {cd.baseNotes.length > 0 && (
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        <span style={{ letterSpacing: "0.08em", textTransform: "uppercase", marginRight: "var(--space-2)" }}>Base</span>
                        {cd.baseNotes.join(", ")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label style={fieldLabel}>Status</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  style={chipStyle(status === s.value)}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Selected frag header */}
          {selectedName && (
            <div
              style={{
                padding: "var(--space-2) var(--space-3)",
                background: "var(--color-surface-raised)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", fontWeight: 500 }}>{selectedName}</div>
              {selectedHouse && (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "var(--space-1)" }}>{selectedHouse}</div>
              )}
              {!isEdit && (
                <button
                  onClick={() => setStep(1)}
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-accent)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginTop: "var(--space-1)",
                  }}
                  className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {/* Status (always shown in step 2 so edit mode can change it) */}
          <div>
            <label style={fieldLabel}>Status</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  style={chipStyle(status === s.value)}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label style={fieldLabel}>Size</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  style={chipStyle(sizes.includes(s))}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label style={fieldLabel}>Concentration</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(type === t ? "" : t)}
                  style={chipStyle(type === t)}
                  className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label style={fieldLabel}>Personal Rating</label>
            <div style={{ display: "flex", gap: "var(--space-1)" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? 0 : n)}
                  style={{
                    fontSize: "22px",
                    lineHeight: 1,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: n <= rating ? "var(--color-accent)" : "var(--color-border-strong)",
                    transition: "opacity var(--transition-fast)",
                  }}
                  className="hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  {n <= rating ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          </div>

          {/* More details toggle */}
          {!moreOpen && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-accent)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
              }}
              className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              + More Details
            </button>
          )}

          {moreOpen && (
            <>
              {/* Where bought */}
              <div>
                <label style={fieldLabel}>Where Bought</label>
                <input
                  value={whereBought}
                  onChange={(e) => setWhereBought(e.target.value)}
                  placeholder="Sephora, Fragrantica, etc."
                  style={inputStyle}
                  className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              {/* Purchase date + price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label style={fieldLabel}>Month</label>
                  <select
                    value={purchaseMonth}
                    onChange={(e) => setPurchaseMonth(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={fieldLabel}>Year</label>
                  <select
                    value={purchaseYear}
                    onChange={(e) => setPurchaseYear(e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
                  >
                    <option value="">—</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={fieldLabel}>Price</label>
                  <input
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="$0"
                    style={inputStyle}
                    className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={fieldLabel}>Personal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Your impressions, context, memories..."
                  style={{ ...inputStyle, resize: "none" }}
                  className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              {/* Dupe */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isDupe}
                    onChange={(e) => setIsDupe(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    This is a dupe of another fragrance
                  </span>
                </label>
                {isDupe && (
                  <input
                    value={dupeFor}
                    onChange={(e) => setDupeFor(e.target.value)}
                    placeholder="Original fragrance name..."
                    style={{ ...inputStyle, marginTop: "var(--space-2)" }}
                    className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
      </ModalBody>
      <ModalFooter>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>{err}</div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {step === 2 && !isEdit && (
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : step === 1 ? "Next" : isEdit ? "Update" : "Save Fragrance"}
            </Button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
