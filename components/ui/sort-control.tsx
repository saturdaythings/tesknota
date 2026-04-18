"use client";

import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
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

export function SortControl({ field, direction, options, onField, onToggleDirection }: SortControlProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
      <Select
        options={options}
        value={field}
        onChange={onField}
        size="auto"
        icon={<ChevronDown size={16} style={{ color: "var(--color-meta-text)", flexShrink: 0 }} />}
      />
      <Button
        variant="icon"
       
        onClick={onToggleDirection}
        title={direction === "asc" ? "Sort ascending" : "Sort descending"}
        aria-label={direction === "asc" ? "Sort ascending" : "Sort descending"}
        style={{ width: "36px", height: "36px" }}
      >
        {direction === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
      </Button>
    </div>
  );
}
