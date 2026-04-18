"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { useData } from "@/lib/data-context";
import type { FragranceStatus } from "@/types";

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
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!open) return;
    setStep(1);
  }, [open]);

  function handleNext() {
    setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  if (!open || !user) return null;

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
          {step === 1 && <div />}
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
