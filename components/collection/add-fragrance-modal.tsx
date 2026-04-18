"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import type { FragranceStatus, CommunityFrag } from "@/types";

const STATUS_OPTIONS = [
  { value: "CURRENT", label: "Current Collection" },
  { value: "PREVIOUSLY_OWNED", label: "Previously Owned" },
  { value: "WANT_TO_SMELL", label: "Want to Smell" },
  { value: "WANT_TO_BUY", label: "Want to Buy" },
  { value: "DONT_LIKE", label: "Have Smelled — Don't Like" },
  { value: "FINISHED", label: "Finished (Empty Bottle)" },
  { value: "WANT_TO_IDENTIFY", label: "Save to Identify Later" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultStatus?: FragranceStatus;
  initialName?: string;
}

function ProgressBar({ step }: { step: number }) {
  const colors1 = step === 1 ? ["var(--color-navy)", "var(--color-cream-dark)"] : ["var(--color-success)", "var(--color-navy)"];
  const labels = ["STEP 1 OF 2 — SEARCH & IDENTIFY", "STEP 2 OF 2 — PERSONAL DETAILS"];

  return (
    <div>
      <div style={{ marginBottom: "var(--space-2)" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)" }}>
          {labels[step - 1]}
        </span>
      </div>
      <div style={{ borderBottom: "1px solid var(--color-cream-dark)", marginBottom: "var(--space-3)" }} />
      <div style={{ display: "flex", gap: 0, height: 4, marginBottom: "var(--space-4)" }}>
        <div style={{ flex: 1, background: colors1[0] }} />
        <div style={{ flex: 1, background: colors1[1] }} />
      </div>
    </div>
  );
}

export function AddFragranceModal({ open, onClose, defaultStatus, initialName }: Props) {
  const { user } = useUser();
  const { communityFrags } = useData();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<CommunityFrag[]>([]);
  const [selected, setSelected] = useState<CommunityFrag | null>(null);
  const [status, setStatus] = useState<FragranceStatus>(defaultStatus ?? "CURRENT");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setQuery(initialName ?? "");
    setDebouncedQuery(initialName ?? "");
    setResults([]);
    setSelected(null);
    setStatus(defaultStatus ?? "CURRENT");
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
      .filter((f) => f.fragranceName.toLowerCase().includes(q) || f.fragranceHouse.toLowerCase().includes(q))
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

  if (!open || !user) return null;

  const showResults = results.length > 0 && !selected;

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(30, 45, 69, 0.4)" }} onClick={onClose} aria-hidden="true" />
      <div style={{ position: "relative", width: "600px", maxHeight: "90vh", background: "var(--color-cream)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-lg)" }}>
        {/* Header */}
        <div style={{ padding: "var(--space-6)", borderBottom: "1px solid var(--color-cream-dark)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-empty-title)", fontStyle: "italic", color: "var(--color-navy)" }}>
              Add Fragrance
            </div>
            <Button variant="icon" onClick={onClose} style={{ color: "var(--color-meta-text)" }}>
              <X size={18} />
            </Button>
          </div>
          <ProgressBar step={step} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
              {/* Search field */}
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-3)" }}>
                  Search Fragrance Name
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (selected) setSelected(null);
                    }}
                    placeholder="e.g. Baccarat Rouge 540"
                    style={{
                      width: "100%",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-meta-text)",
                      border: "none",
                      borderBottomStyle: "solid",
                      background: "transparent",
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-base)",
                      color: "var(--color-navy)",
                      outline: "none",
                    }}
                    onFocus={() => {}}
                  />
                  {showResults && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, marginTop: "var(--space-2)" }}>
                      {results.map((f) => (
                        <div
                          key={f.fragranceId}
                          onClick={() => handleSelect(f)}
                          style={{
                            background: "var(--color-cream-dark)",
                            padding: "var(--space-4)",
                            marginBottom: "var(--space-2)",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-lg)", fontStyle: "italic", color: "var(--color-navy)", marginBottom: "var(--space-1)" }}>
                            {f.fragranceName}
                          </div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-2)" }}>
                            {f.fragranceHouse}
                          </div>
                          <div style={{ borderTop: "1px solid var(--color-row-divider)", paddingTop: "var(--space-2)", marginBottom: "var(--space-2)" }} />
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-1)" }}>
                            Avg Price
                          </div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", color: "var(--color-navy)", fontWeight: "bold", marginBottom: "var(--space-2)" }}>
                            {f.avgPrice ?? "N/A"}
                          </div>
                          {f.fragranceAccords && f.fragranceAccords.length > 0 && (
                            <div style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-note)", fontStyle: "italic", color: "var(--color-navy)" }}>
                              {f.fragranceAccords.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status field */}
              <div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-meta-text)", textTransform: "uppercase", letterSpacing: "var(--tracking-wide)", marginBottom: "var(--space-3)" }}>
                  Status
                </div>
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
          {step === 2 && <div />}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--color-cream-dark)", padding: "var(--space-4) var(--space-6)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-3)" }}>
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <div style={{ flex: 1 }} />
              <Button variant="primary" onClick={handleNext}>Next</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={handleBack} style={{ border: "none" }}>Back</Button>
              <div style={{ flex: 1 }} />
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={onClose}>Save Fragrance</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
