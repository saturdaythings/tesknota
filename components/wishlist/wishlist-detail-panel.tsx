"use client";

import { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabPill } from "@/components/ui/tab-pill";
import { X } from "@/components/ui/Icons";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ui/toast";
import { WISHLIST_PRIORITY_LABELS, type WishlistPriority } from "@/types";
import type { UserFragrance, CommunityFrag, FragranceType } from "@/types";

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

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  color: "var(--color-meta-text)",
  minWidth: "var(--size-row-min)",
  flexShrink: 0,
};

const valueStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  color: "var(--color-navy)",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)" }}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{children}</span>
    </div>
  );
}

interface Props {
  frag: UserFragrance | null;
  open: boolean;
  onClose: () => void;
  communityFrags: CommunityFrag[];
  onAddToCollection: (frag: UserFragrance) => void;
  onRemove: (frag: UserFragrance) => void;
}

export function WishlistDetailPanel({ frag, open, onClose, communityFrags, onRemove }: Props) {
  const { editFrag } = useData();
  const { toast } = useToast();

  const [priority, setPriority] = useState<WishlistPriority | null>(null);
  const [notes, setNotes] = useState("");
  const [concentration, setConcentration] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!frag || !open) return;
    setPriority(frag.wishlistPriority);
    setNotes(frag.personalNotes ?? "");
    setConcentration(frag.type ?? "");
  }, [frag?.id, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const cd = frag
    ? communityFrags.find(
        (c) =>
          (frag.fragranceId && c.fragranceId === frag.fragranceId) ||
          (normStr(c.fragranceName) === normStr(frag.name) &&
            normStr(c.fragranceHouse) === normStr(frag.house ?? "")),
      ) ?? null
    : null;

  async function handleSave() {
    if (!frag) return;
    setSaving(true);
    try {
      await editFrag({
        ...frag,
        wishlistPriority: priority,
        personalNotes: notes.trim(),
        type: (concentration as FragranceType) || null,
      });
      toast("Saved", "success");
      onClose();
    } catch {
      toast("Could not save - try again", "error");
    }
    setSaving(false);
  }

  function handleRemove() {
    if (!frag) return;
    onRemove(frag);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}>
      {/* Custom header: name + house, two-line */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          padding: "var(--space-6) var(--space-8)",
          borderBottom: "1px solid var(--color-cream-dark)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: "var(--text-lg)",
              color: "var(--color-navy)",
              lineHeight: "var(--leading-tight)",
              marginBottom: "var(--space-1)",
            }}
          >
            {frag?.name}
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              textTransform: "uppercase",
              fontSize: "var(--text-label)",
              letterSpacing: "var(--tracking-wide)",
              color: "var(--color-meta-text)",
            }}
          >
            {frag?.house}
          </div>
        </div>
        <Button variant="icon" aria-label="Close" onClick={onClose} style={{ flexShrink: 0 }}>
          <X size={16} />
        </Button>
      </div>

      <ModalBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {cd?.avgPrice && <Row label="Avg Price">{cd.avgPrice}</Row>}
          {cd?.communityRating && (
            <Row label="Community Rating">{parseFloat(cd.communityRating).toFixed(1)} / 10</Row>
          )}
          {cd?.communityLongevityLabel && (
            <Row label="Longevity">{cd.communityLongevityLabel}</Row>
          )}
          {cd?.communitySillageLabel && (
            <Row label="Sillage">{cd.communitySillageLabel}</Row>
          )}
          {cd?.topNotes?.length ? <Row label="Top Notes">{cd.topNotes.join(", ")}</Row> : null}
          {cd?.middleNotes?.length ? <Row label="Heart Notes">{cd.middleNotes.join(", ")}</Row> : null}
          {cd?.baseNotes?.length ? <Row label="Base Notes">{cd.baseNotes.join(", ")}</Row> : null}
          {cd?.fragranceAccords?.length ? (
            <Row label="Accords">{cd.fragranceAccords.join(", ")}</Row>
          ) : null}

          <div style={{ borderTop: "1px solid var(--color-row-divider)", margin: "var(--space-1) 0" }} />

          {/* Concentration */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={labelStyle}>Concentration</span>
            <div style={{ flex: 1 }}>
              <Select
                options={CONCENTRATION_OPTIONS}
                value={concentration}
                onChange={setConcentration}
                placeholder="Select concentration"
              />
            </div>
          </div>

          {/* Priority */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
            <span style={{ ...labelStyle, paddingTop: "var(--space-1)" }}>Priority</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {PRIORITY_KEYS.map((p) => (
                <span key={p} title={PRIORITY_TOOLTIPS[p]}>
                  <TabPill
                    label={WISHLIST_PRIORITY_LABELS[p].label}
                    active={priority === p}
                    onClick={() => setPriority(priority === p ? null : p)}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
            <span style={{ ...labelStyle, paddingTop: "var(--space-2)" }}>Notes</span>
            <div style={{ flex: 1 }}>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thoughts, occasions, memories..."
                rows={3}
                style={{
                  fontSize: "var(--text-sm)",
                  letterSpacing: "var(--tracking-xs)",
                  color: "var(--color-navy)",
                }}
              />
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="justify-between">
        <Button variant="destructive" onClick={handleRemove} disabled={saving}>
          Remove from Wishlist
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
