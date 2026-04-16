"use client";

import { useState, useRef, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
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

  const [search, setSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");
  const [selectedFragId, setSelectedFragId] = useState("");
  const [status, setStatus] = useState<FragranceStatus>("CURRENT");

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

  const activeButtonClass = "border-[var(--color-accent)] text-white bg-[var(--color-accent)]";
  const inactiveButtonClass = "border-[var(--color-cream-dark)] text-[var(--color-navy)] hover:border-[var(--color-navy)]";
  const inputClass = "w-full px-3 py-[9px] border border-[var(--color-cream-dark)] bg-[var(--color-cream)] font-[var(--font-sans)] text-sm text-[var(--color-navy)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy)]";

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
      {step === 1 && (
        <div className="space-y-5">
          {/* Search */}
          <div>
            <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
              Fragrance Name
            </label>
            <div className="relative">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => search.trim().length >= 2 && setDropOpen(true)}
                onBlur={() => setTimeout(() => setDropOpen(false), 150)}
                placeholder="Search by name or house..."
                className={inputClass}
              />
              {dropOpen && matches.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 border border-[var(--color-cream-dark)] border-t-0 bg-[var(--color-cream)] shadow-sm max-h-[220px] overflow-y-auto">
                  {matches.map((cf) => (
                    <div
                      key={cf.fragranceId}
                      onMouseDown={() => selectMatch(cf)}
                      className="px-3 py-[9px] cursor-pointer hover:bg-[var(--color-cream-dark)] border-b border-[var(--color-cream-dark)] last:border-0"
                    >
                      <div className="font-[var(--font-sans)] text-sm text-[var(--color-navy)]">{cf.fragranceName}</div>
                      <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">{cf.fragranceHouse}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedName && (
              <div className="mt-2 px-3 py-3 bg-[var(--color-cream-dark)] border border-[var(--color-cream-dark)]">
                <div className="font-[var(--font-sans)] text-sm text-[var(--color-navy)]">{selectedName}</div>
                {selectedHouse && (
                  <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)] uppercase tracking-[0.08em] mt-[2px]">{selectedHouse}</div>
                )}
                {(cd?.avgPrice || cd?.communityRating) && (
                  <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)] mt-[3px]">
                    {[cd.avgPrice?.replace(/~/g, ""), cd.communityRating ? cd.communityRating + "/10" : ""].filter(Boolean).join(" · ")}
                  </div>
                )}
                {cd && cd.accords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {cd.accords.slice(0, 8).map((a) => (
                      <span key={a} className="font-[var(--font-sans)] text-xs px-2 py-[3px] border border-[var(--color-cream-dark)] text-[var(--color-navy)]">{a}</span>
                    ))}
                  </div>
                )}
                {cd && (cd.topNotes.length > 0 || cd.middleNotes.length > 0 || cd.baseNotes.length > 0) && (
                  <div className="mt-3 space-y-[6px]">
                    {cd.topNotes.length > 0 && (
                      <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
                        <span className="tracking-[0.08em] uppercase mr-2">Top</span>
                        {cd.topNotes.join(", ")}
                      </div>
                    )}
                    {cd.middleNotes.length > 0 && (
                      <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
                        <span className="tracking-[0.08em] uppercase mr-2">Mid</span>
                        {cd.middleNotes.join(", ")}
                      </div>
                    )}
                    {cd.baseNotes.length > 0 && (
                      <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)]">
                        <span className="tracking-[0.08em] uppercase mr-2">Base</span>
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
            <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={"px-3 py-[5px] font-[var(--font-sans)] text-xs border transition-colors " + (status === s.value ? activeButtonClass : inactiveButtonClass)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          {/* Selected frag header */}
          {selectedName && (
            <div className="px-3 py-2 bg-[var(--color-cream-dark)] border border-[var(--color-cream-dark)]">
              <div className="font-[var(--font-sans)] text-sm text-[var(--color-navy)]">{selectedName}</div>
              {selectedHouse && (
                <div className="font-[var(--font-sans)] text-xs text-[var(--color-navy)] uppercase tracking-[0.08em] mt-[2px]">{selectedHouse}</div>
              )}
              {!isEdit && (
                <button
                  onClick={() => setStep(1)}
                  className="font-[var(--font-sans)] text-xs text-[var(--color-accent)] mt-1 hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  Change
                </button>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={"px-3 py-[5px] font-[var(--font-sans)] text-xs border transition-colors " + (status === s.value ? activeButtonClass : inactiveButtonClass)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
              Size
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={"px-3 py-[5px] font-[var(--font-sans)] text-xs border transition-colors " + (sizes.includes(s) ? activeButtonClass : inactiveButtonClass)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
              Concentration
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(type === t ? "" : t)}
                  className={"px-3 py-[5px] font-[var(--font-sans)] text-xs border transition-colors " + (type === t ? activeButtonClass : inactiveButtonClass)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
              Personal Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className="text-[22px] leading-none bg-transparent border-none cursor-pointer p-0 transition-opacity hover:opacity-80"
                  style={{ color: n <= rating ? "var(--color-accent)" : "var(--color-cream-dark)" }}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  {n <= rating ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          </div>

          {!moreOpen && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="font-[var(--font-sans)] text-xs text-[var(--color-accent)] hover:underline text-left"
            >
              + More Details
            </button>
          )}

          {moreOpen && (
            <>
              {/* Where bought */}
              <div>
                <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
                  Where Bought
                </label>
                <input
                  value={whereBought}
                  onChange={(e) => setWhereBought(e.target.value)}
                  placeholder="Sephora, Fragrantica, etc."
                  className={inputClass}
                />
              </div>

              {/* Purchase date + price */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
                    Month
                  </label>
                  <select
                    value={purchaseMonth}
                    onChange={(e) => setPurchaseMonth(e.target.value)}
                    className="w-full px-3 py-[9px] border border-[var(--color-cream-dark)] bg-[var(--color-cream)] font-[var(--font-sans)] text-xs text-[var(--color-navy)] focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
                    Year
                  </label>
                  <select
                    value={purchaseYear}
                    onChange={(e) => setPurchaseYear(e.target.value)}
                    className="w-full px-3 py-[9px] border border-[var(--color-cream-dark)] bg-[var(--color-cream)] font-[var(--font-sans)] text-xs text-[var(--color-navy)] focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                  >
                    <option value="">—</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
                    Price
                  </label>
                  <input
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="$0"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.1em] uppercase mb-2">
                  Personal Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Your impressions, context, memories..."
                  className="w-full px-3 py-[9px] border border-[var(--color-cream-dark)] bg-[var(--color-cream)] font-[var(--font-sans)] text-sm text-[var(--color-navy)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy)] resize-none"
                />
              </div>

              {/* Dupe */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDupe}
                    onChange={(e) => setIsDupe(e.target.checked)}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className="font-[var(--font-sans)] text-xs text-[var(--color-navy)] tracking-[0.05em] uppercase">
                    This is a dupe of another fragrance
                  </span>
                </label>
                {isDupe && (
                  <input
                    value={dupeFor}
                    onChange={(e) => setDupeFor(e.target.value)}
                    placeholder="Original fragrance name..."
                    className={"mt-2 " + inputClass}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div className="font-[var(--font-sans)] text-xs text-[var(--color-destructive)]">{err}</div>
          <div className="flex gap-2">
            {step === 2 && !isEdit && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-[7px] font-[var(--font-sans)] text-xs text-[var(--color-navy)] border border-[var(--color-cream-dark)] hover:border-[var(--color-navy)] transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-[7px] font-[var(--font-sans)] text-xs bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Saving..." : step === 1 ? "Next" : isEdit ? "Update" : "Save Fragrance"}
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
