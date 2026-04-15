"use client";

import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
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

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 2px)",
    left: 0,
    right: 0,
    zIndex: "var(--z-dropdown)" as unknown as number,
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-surface)",
    boxShadow: "var(--shadow-md)",
    maxHeight: "200px",
    overflowY: "auto",
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={isEdit ? "Edit Compliment" : "Log a Compliment"} onClose={onClose} />
      <ModalBody>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        {/* Fragrance picker */}
        <div>
          <label style={fieldLabel}>Fragrance</label>
          <div style={{ position: "relative" }}>
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
              style={inputStyle}
              className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
            />
            {fragDropOpen && fragMatches.length > 0 && (
              <div style={dropdownStyle}>
                {fragMatches.map((f) => (
                  <div
                    key={f.id}
                    onMouseDown={() => selectFrag(f)}
                    style={{ padding: "var(--space-2) var(--space-3)", cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{f.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{f.house}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Layering fragrance */}
        <div>
          <label style={fieldLabel}>
            Layering Fragrance{" "}
            <span style={{ textTransform: "none", letterSpacing: "normal", fontWeight: 400, color: "var(--color-text-muted)" }}>(optional)</span>
          </label>
          <div style={{ position: "relative" }}>
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
              style={inputStyle}
              className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
            />
            {secDropOpen && secMatches.length > 0 && (
              <div style={dropdownStyle}>
                {secMatches.map((f) => (
                  <div
                    key={f.id}
                    onMouseDown={() => selectSecFrag(f)}
                    style={{ padding: "var(--space-2) var(--space-3)", cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}
                    className="last:border-0 hover:bg-[var(--color-surface-raised)]"
                  >
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>{f.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{f.house}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Relation */}
        <div>
          <label style={fieldLabel}>Relation</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {RELATIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRelation(r)}
                style={chipStyle(relation === r)}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label style={fieldLabel}>Gender</label>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {(["Female", "Male"] as ComplimenterGender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                style={chipStyle(gender === g)}
                className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Month + Year */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div>
            <label style={fieldLabel}>Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={fieldLabel}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
              className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)]"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Location (optional) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <label style={{ ...fieldLabel, marginBottom: 0 }}>Location (optional)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue or occasion"
            style={inputStyle}
            className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              style={inputStyle}
              className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
            />
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Country"
              style={inputStyle}
              className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={fieldLabel}>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Context, reaction, moment..."
            style={{ ...inputStyle, resize: "none" }}
            className="focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      </div>
      </ModalBody>
      <ModalFooter>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            {isEdit && !confirmDelete && (
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            )}
            {isEdit && confirmDelete && (
              <>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>Remove permanently?</span>
                <Button variant="danger" size="sm" onClick={handleDelete}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </>
            )}
            {err && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-danger)" }}>{err}</span>}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={save}
            disabled={saving || confirmDelete}
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Log"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
