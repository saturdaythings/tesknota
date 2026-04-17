"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
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

/**
 * Sort field picker + direction toggle. Field select shrinks to label width;
 * arrow button defaults to desc (down), toggles to asc (up) on click.
 */
export function SortControl({ field, direction, options, onField, onToggleDirection }: SortControlProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
      <Select options={options} value={field} onChange={onField} size="auto" />
      <Button
        variant="icon"
        size="sm"
        onClick={onToggleDirection}
        aria-label={direction === "asc" ? "Sort ascending" : "Sort descending"}
      >
        {direction === "asc" ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </Button>
    </div>
  );
}
