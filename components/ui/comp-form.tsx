"use client";

import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { MONTHS } from "@/lib/frag-utils";
import { useToast } from "@/components/ui/toast";
import type { UserCompliment, Relation, ComplimenterGender } from "@/types";

const RELATIONS: Relation[] = [
  "Stranger",
  "Friend",
  "Colleague / Client",
  "Family",
  "Significant Other",
  "Other",
];

const YEARS = Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) =>
  String(new Date().getFullYear() - i)
);

function genId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: UserCompliment | null;
  prefillFragId?: string;
}

export function CompForm({ open, onClose, editing, prefillFragId }: Props) {
  const { user } = useUser();
  const { fragrances, addComp, editComp, removeComp } = useData();
  const { toast } = useToast();

  const isEdit = !!editing;

  const now = new Date();
  const curMonth = String(now.getMonth() + 1).padStart(2, "0");
  const curYear = String(now.getFullYear());

  // Normalize month to numeric "01"-"12" whether stored as "Apr" or "04"
  function normalizeMonth(m: string): string {
    if (!m) return curMonth;
    if (/^\d{1,2}$/.test(m)) return m.padStart(2, "0");
    const idx = MONTHS.findIndex((mn) => mn.toLowerCase() === m.toLowerCase().slice(0, 3));
    return idx >= 0 ? String(idx + 1).padStart(2, "0") : curMonth;
  }

  // Fields
  const [fragSearch, setFragSearch] = useState("");
  const [fragDropOpen, setFragDropOpen] = useState(false);
  const [primaryFragId, setPrimaryFragId] = useState("");
  const [primaryFragName, setPrimaryFragName] = useState("");
  const [secSearch, setSecSearch] = useState("");
  const [secDropOpen, setSecDropOpen] = useState(false);
  const [secondaryFragId, setSecondaryFragId] = useState("");
  const [secondaryFragName, setSecondaryFragName] = useState("");
  const [relation, setRelation] = useState<Relation>("Stranger");
  const [gender, setGender] = useState<ComplimenterGender>("Female");
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("US");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const eligibleFrags = user
    ? fragrances.filter(
        (f) =>
          f.userId === user.id &&
          (f.status === "CURRENT" || f.status === "PREVIOUSLY_OWNED" || f.status === "FINISHED")
      )
    : [];

  const fragMatches = fragSearch.trim().length >= 1
    ? eligibleFrags.filter((f) =>
        f.name.toLowerCase().includes(fragSearch.toLowerCase())
      ).slice(0, 8)
    : eligibleFrags.slice(0, 8);

  const secMatches = secSearch.trim().length >= 1
    ? eligibleFrags.filter((f) =>
        f.name.toLowerCase().includes(secSearch.toLowerCase())
      ).slice(0, 8)
    : eligibleFrags.slice(0, 8);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const ef = fragrances.find((f) => f.fragranceId === editing.primaryFragId || f.id === editing.primaryFragId);
      setFragSearch(editing.primaryFrag);
      setPrimaryFragId(editing.primaryFragId ?? "");
      setPrimaryFragName(editing.primaryFrag);
      setSecSearch(editing.secondaryFrag ?? "");
      setSecondaryFragId(editing.secondaryFragId ?? "");
      setSecondaryFragName(editing.secondaryFrag ?? "");
      setRelation(editing.relation);
      setGender(editing.gender ?? "Female");
      setMonth(normalizeMonth(editing.month || curMonth));
      setYear(editing.year || curYear);
      setLocation(editing.location ?? "");
      setCity(editing.city ?? "");
      setCountry(editing.country || "US");
      setNotes(editing.notes ?? "");
      void ef;
    } else {
      const pre = prefillFragId ? fragrances.find((f) => f.id === prefillFragId || f.fragranceId === prefillFragId) : null;
      setFragSearch(pre ? pre.name : "");
      setPrimaryFragId(pre ? (pre.fragranceId || pre.id) : "");
      setPrimaryFragName(pre ? pre.name : "");
      setSecSearch("");
      setSecondaryFragId("");
      setSecondaryFragName("");
      setRelation("Stranger");
      setGender("Female");
      setMonth(curMonth);
      setYear(curYear);
      setLocation("");
      setCity("");
      setCountry("US");
      setNotes("");
    }
    setFragDropOpen(false);
    setErr("");
    setSaving(false);
    setConfirmDelete(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, prefillFragId]);

  function selectFrag(f: typeof eligibleFrags[0]) {
    setFragSearch(f.name);
    setPrimaryFragId(f.fragranceId || f.id);
    setPrimaryFragName(f.name);
    setFragDropOpen(false);
  }

  function selectSecFrag(f: typeof eligibleFrags[0]) {
    setSecSearch(f.name);
    setSecondaryFragId(f.fragranceId || f.id);
    setSecondaryFragName(f.name);
    setSecDropOpen(false);
  }

  async function save() {
    if (!user) return;
    if (!primaryFragId) { setErr("Select a fragrance."); return; }
    if (!month || !year) { setErr("Month and year required."); return; }

    setSaving(true);
    setErr("");

    const comp: UserCompliment = {
      id: editing?.id ?? genId(),
      userId: user.id,
      primaryFragId,
      primaryFrag: primaryFragName,
      secondaryFragId: secondaryFragId || null,
      secondaryFrag: secondaryFragName || null,
      gender,
      relation,
      month,
      year,
      location: location.trim() || null,
      city: city.trim() || null,
      state: editing?.state ?? null,
      country: country || "US",
      notes: notes.trim() || null,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };

    try {
      if (isEdit) {
        await editComp(comp);
        toast("Compliment updated.");
      } else {
        await addComp(comp);
        toast("Compliment logged.");
      }
      onClose();
    } catch (e) {
      setErr("Save failed. Check connection.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await removeComp(editing.id);
      toast("Compliment deleted.");
      onClose();
    } catch (e) {
      setErr("Delete failed.");
      console.error(e);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={isEdit ? "Edit Compliment" : "Log a Compliment"} onClose={onClose} />
      <ModalBody>
      <div className="space-y-5">
        {/* Fragrance picker */}
        <div>
          <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
            Fragrance
          </label>
          <div className="relative">
            <input
              value={fragSearch}
              onChange={(e) => {
                setFragSearch(e.target.value);
                setPrimaryFragId("");
                setPrimaryFragName("");
                setFragDropOpen(true);
              }}
              onFocus={() => setFragDropOpen(true)}
              onBlur={() => setTimeout(() => setFragDropOpen(false), 150)}
              placeholder="Search your collection..."
              className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
            />
            {fragDropOpen && fragMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 border border-[var(--b3)] border-t-0 bg-[var(--off)] shadow-sm max-h-[200px] overflow-y-auto">
                {fragMatches.map((f) => (
                  <div
                    key={f.id}
                    onMouseDown={() => selectFrag(f)}
                    className="px-3 py-[9px] cursor-pointer hover:bg-[var(--b1)] border-b border-[var(--b1)] last:border-0"
                  >
                    <div className="font-[var(--body)] text-sm text-[var(--ink)]">{f.name}</div>
                    <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{f.house}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Layering fragrance */}
        <div>
          <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
            Layering Fragrance <span className="normal-case tracking-normal text-[var(--ink4)]">(optional)</span>
          </label>
          <div className="relative">
            <input
              value={secSearch}
              onChange={(e) => {
                setSecSearch(e.target.value);
                setSecondaryFragId("");
                setSecondaryFragName("");
                setSecDropOpen(true);
              }}
              onFocus={() => setSecDropOpen(true)}
              onBlur={() => setTimeout(() => setSecDropOpen(false), 150)}
              placeholder="Search your collection..."
              className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
            />
            {secDropOpen && secMatches.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 border border-[var(--b3)] border-t-0 bg-[var(--off)] shadow-sm max-h-[200px] overflow-y-auto">
                {secMatches.map((f) => (
                  <div
                    key={f.id}
                    onMouseDown={() => selectSecFrag(f)}
                    className="px-3 py-[9px] cursor-pointer hover:bg-[var(--b1)] border-b border-[var(--b1)] last:border-0"
                  >
                    <div className="font-[var(--body)] text-sm text-[var(--ink)]">{f.name}</div>
                    <div className="font-[var(--mono)] text-xs text-[var(--ink3)]">{f.house}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Relation */}
        <div>
          <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
            Relation
          </label>
          <div className="flex flex-wrap gap-2">
            {RELATIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRelation(r)}
                className={
                  "px-3 py-[5px] font-[var(--mono)] text-xs border transition-colors " +
                  (relation === r
                    ? "border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]"
                    : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--b4)]")
                }
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
            Gender
          </label>
          <div className="flex gap-2">
            {(["Female", "Male"] as ComplimenterGender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={
                  "px-3 py-[5px] font-[var(--mono)] text-xs border transition-colors " +
                  (gender === g
                    ? "border-[var(--blue)] text-[var(--blue)] bg-[var(--blue-tint)]"
                    : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--b4)]")
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Month + Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--mono)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--mono)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] cursor-pointer"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Location (optional) */}
        <div className="space-y-3">
          <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase">
            Location (optional)
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue or occasion"
            className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
            />
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-[var(--mono)] text-xs text-[var(--ink3)] tracking-[0.1em] uppercase mb-2">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Context, reaction, moment..."
            className="w-full px-3 py-[9px] border border-[var(--b3)] bg-[var(--off)] font-[var(--body)] text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--ink4)] resize-none"
          />
        </div>
      </div>
      </ModalBody>
      <ModalFooter>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {isEdit && !confirmDelete && (
              <button
                onClick={handleDelete}
                className="font-[var(--mono)] text-xs text-[var(--rose-tk)] border border-[var(--rose-tk)] px-3 py-[5px] hover:bg-[var(--rose-tk)] hover:text-white transition-colors"
              >
                Delete
              </button>
            )}
            {isEdit && confirmDelete && (
              <>
                <span className="font-[var(--mono)] text-xs text-[var(--rose-tk)]">Remove permanently?</span>
                <button
                  onClick={handleDelete}
                  className="font-[var(--mono)] text-xs bg-[var(--rose-tk)] text-white px-3 py-[5px] hover:opacity-90"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="font-[var(--mono)] text-xs border border-[var(--b3)] text-[var(--ink3)] px-3 py-[5px]"
                >
                  Cancel
                </button>
              </>
            )}
            {err && <span className="font-[var(--mono)] text-xs text-[var(--rose-tk)]">{err}</span>}
          </div>
          <button
            onClick={save}
            disabled={saving || confirmDelete}
            className="px-5 py-[7px] font-[var(--mono)] text-xs bg-[var(--blue)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Log"}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
