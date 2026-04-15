"use client";

import { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import type { UserCompliment, UserFragrance, Relation, ComplimenterGender } from "@/types";

// ── Constants ─────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "Male", label: "Man" },
  { value: "Female", label: "Woman" },
];

const RELATION_OPTIONS = [
  { value: "Significant Other", label: "Partner" },
  { value: "Friend", label: "Friend" },
  { value: "Family", label: "Family" },
  { value: "Colleague / Client", label: "Colleague" },
  { value: "Stranger", label: "Stranger" },
  { value: "Other", label: "Other" },
];

const ELIGIBLE_STATUSES = new Set(["CURRENT", "PREVIOUSLY_OWNED", "FINISHED"]);

function genId(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Inline fragrance search ────────────────────────────────

interface FragSearchProps {
  label: string;
  value: string;
  onSelect: (frag: UserFragrance | null) => void;
  frags: UserFragrance[];
  exclude?: string;
  locked?: boolean;
  error?: string;
  placeholder?: string;
}

function FragSearch({
  label,
  value,
  onSelect,
  frags,
  exclude,
  locked,
  error,
  placeholder = "Search your collection...",
}: FragSearchProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const matches = query.trim().length >= 1
    ? frags
        .filter(
          (f) =>
            f.id !== exclude &&
            (f.name.toLowerCase().includes(query.toLowerCase()) ||
              f.house.toLowerCase().includes(query.toLowerCase())),
        )
        .slice(0, 8)
    : frags.filter((f) => f.id !== exclude).slice(0, 8);

  function pick(f: UserFragrance) {
    setQuery(f.name);
    setOpen(false);
    onSelect(f);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <label className="text-label" style={{ marginBottom: "var(--space-1)" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          value={query}
          readOnly={locked}
          disabled={locked}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect(null);
            setOpen(true);
          }}
          onFocus={() => !locked && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full h-10 px-3 bg-[var(--color-surface)] border border-[1.5px] border-[var(--color-border)] rounded-[var(--radius-sm)] font-sans text-[length:var(--text-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-[border-color,box-shadow] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] disabled:opacity-60 disabled:cursor-not-allowed"
          style={error ? { borderColor: "var(--color-danger)" } : undefined}
        />
        {open && matches.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 20,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-md)",
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {matches.map((f) => (
              <div
                key={f.id}
                onMouseDown={() => pick(f)}
                style={{
                  height: 52,
                  padding: "0 var(--space-4)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--color-border)",
                }}
                className="hover:bg-[var(--color-surface-raised)] last:border-b-0"
              >
                <div className="text-body" style={{ fontWeight: 500 }}>
                  {f.name}
                </div>
                <div className="text-secondary">{f.house}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && (
        <p
          role="alert"
          style={{
            marginTop: "var(--space-1)",
            fontSize: "var(--text-xs)",
            color: "var(--color-danger)",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  prefillFragId?: string;
}

export function LogComplimentModal({ open, onClose, prefillFragId }: Props) {
  const { user } = useUser();
  const { fragrances, addComp } = useData();
  const { toast } = useToast();

  const eligible = user
    ? fragrances.filter(
        (f) => f.userId === user.id && ELIGIBLE_STATUSES.has(f.status),
      )
    : [];

  const prefilled = prefillFragId
    ? eligible.find((f) => f.id === prefillFragId || f.fragranceId === prefillFragId) ?? null
    : null;

  // Fields
  const [primaryFrag, setPrimaryFrag] = useState<UserFragrance | null>(null);
  const [date, setDate] = useState(todayIso());
  const [gender, setGender] = useState<ComplimenterGender | "">("");
  const [relation, setRelation] = useState<Relation | "">("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [secondaryFrag, setSecondaryFrag] = useState<UserFragrance | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Errors
  const [fragError, setFragError] = useState("");
  const [dateError, setDateError] = useState("");

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setPrimaryFrag(prefilled);
    setDate(todayIso());
    setGender("");
    setRelation("");
    setLocation("");
    setCity("");
    setCountry("");
    setSecondaryFrag(null);
    setNotes("");
    setSaving(false);
    setFragError("");
    setDateError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillFragId]);

  function validate(): boolean {
    let ok = true;
    if (!primaryFrag) {
      setFragError("Select a fragrance.");
      ok = false;
    } else {
      setFragError("");
    }
    if (!date) {
      setDateError("Date is required.");
      ok = false;
    } else {
      setDateError("");
    }
    return ok;
  }

  async function save() {
    if (!user || !validate()) return;
    setSaving(true);

    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear());

    const comp: UserCompliment = {
      id: genId(),
      userId: user.id,
      primaryFragId: primaryFrag!.fragranceId || primaryFrag!.id,
      primaryFrag: primaryFrag!.name,
      secondaryFragId: secondaryFrag
        ? secondaryFrag.fragranceId || secondaryFrag.id
        : null,
      secondaryFrag: secondaryFrag?.name ?? null,
      gender: gender || null,
      relation: (relation || "Stranger") as Relation,
      month,
      year,
      location: location.trim() || null,
      city: city.trim() || null,
      state: null,
      country: country.trim() || "US",
      notes: notes.trim() || null,
      createdAt: new Date(date).toISOString(),
    };

    try {
      await addComp(comp);
      toast("Compliment logged.", "success");
      onClose();
    } catch (e) {
      console.error(e);
      toast("Failed to save. Check your connection.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-[520px]">
      <ModalHeader title="Log a Compliment" onClose={onClose} />
      <ModalBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Primary fragrance */}
          <FragSearch
            label="Fragrance *"
            value={primaryFrag?.name ?? ""}
            onSelect={(f) => {
              setPrimaryFrag(f);
              if (f) setFragError("");
            }}
            frags={eligible}
            locked={!!prefilled}
            error={fragError}
          />

          {/* Date */}
          <Input
            label="Date *"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value) setDateError("");
            }}
            error={dateError}
            required
          />

          {/* Gender + Relation */}
          <div
            style={{ display: "flex", gap: "var(--space-3)" }}
            className="flex-col sm:flex-row"
          >
            <div style={{ flex: 1 }}>
              <Select
                label="Gender"
                options={GENDER_OPTIONS}
                value={gender}
                onChange={(v) => setGender(v as ComplimenterGender)}
                placeholder="Gender"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select
                label="Relation"
                options={RELATION_OPTIONS}
                value={relation}
                onChange={(v) => setRelation(v as Relation)}
                placeholder="Relation"
              />
            </div>
          </div>

          {/* Location */}
          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where were you? e.g. Office, dinner"
          />

          {/* City + Country */}
          <div
            style={{ display: "flex", gap: "var(--space-3)" }}
            className="flex-col sm:flex-row"
          >
            <div style={{ flex: 1 }}>
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>

          {/* Layering fragrance */}
          <FragSearch
            label="Layering Fragrance"
            value={secondaryFrag?.name ?? ""}
            onSelect={setSecondaryFrag}
            frags={eligible}
            exclude={primaryFrag?.id}
            placeholder="Add a layering fragrance (optional)"
          />

          {/* Notes */}
          <Textarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What did they say?"
            style={{ minHeight: 80 }}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Compliment"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
