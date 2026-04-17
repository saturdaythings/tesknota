"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface SortOption {
  value: string;
  label: string;
}

interface SortControlProps {
  field: string;
  direction: "asc" | "desc";
  options: SortOption[];
  onField: (field: string) => void;
  onToggleDirection: () => void;
}

function SortSelectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: 'var(--color-meta-text)', flexShrink: 0 }}>
      <line x1="8" y1="2" x2="8" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 8L8 13L11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortArrowAsc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 7L8 3L12 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SortArrowDesc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 9L8 13L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SortControl({ field, direction, options, onField, onToggleDirection }: SortControlProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
      <Select options={options} value={field} onChange={onField} size="auto" icon={<SortSelectIcon />} />
      <Button
        variant="icon"
        size="sm"
        onClick={onToggleDirection}
        aria-label={direction === "asc" ? "Sort ascending" : "Sort descending"}
        style={{ width: "36px", height: "36px" }}
      >
        {direction === "asc" ? <SortArrowAsc /> : <SortArrowDesc />}
      </Button>
    </div>
  );
}
