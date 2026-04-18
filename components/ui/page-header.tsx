"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

export interface FilterBarSortOption {
  value: string;
  label: string;
}

export interface FilterBarFilter {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export interface PageHeaderProps {
  // ROW 1: Search and Add
  searchValue: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  addLabel: string;
  onAdd: () => void;

  // ROW 2: Filters and Pagination (Left side)
  sortFields: FilterBarSortOption[];
  sortField: string;
  onSortField: (v: string) => void;
  sortDir: "asc" | "desc";
  onSortDir: () => void;
  filters?: FilterBarFilter[];
  filtersActive: boolean;
  onClearFilters?: () => void;

  // ROW 2: Pagination (Right side)
  perPage: number;
  onPerPage: (v: number) => void;

  // ROW 3: Count label
  count?: number;
  countLabel: string;
  isLoaded?: boolean;
}

function SortDirButton({ dir, onClick }: { dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      className="h-9 w-9 flex-shrink-0 p-0"
      aria-label={dir === "desc" ? "Sorted descending" : "Sorted ascending"}
      onClick={onClick}
    >
      {dir === "desc" ? (
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
          <line x1="8" y1="2" x2="8" y2="9" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="4" y1="9" x2="12" y2="9" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="5,11 8,15 11,11" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      ) : (
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
          <polyline points="5,7 8,3 11,7" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <line x1="4" y1="9" x2="12" y2="9" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="8" y1="9" x2="8" y2="16" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </Button>
  );
}

export function PageHeader({
  searchValue,
  onSearch,
  searchPlaceholder,
  addLabel,
  onAdd,
  sortFields,
  sortField,
  onSortField,
  sortDir,
  onSortDir,
  filters,
  filtersActive,
  onClearFilters,
  perPage,
  onPerPage,
  count,
  countLabel,
  isLoaded,
}: PageHeaderProps) {
  const PER_PAGE_OPTIONS = [
    { value: "25", label: "25" },
    { value: "50", label: "50" },
    { value: "0", label: "All" },
  ];

  return (
    <div>
      {/* ROW 1: Search (left) + Add button (right) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-2)",
          paddingBottom: "var(--space-3)",
          borderBottom: "1px solid var(--color-row-divider)",
        }}
      >
        <SearchInput value={searchValue} onChange={onSearch} placeholder={searchPlaceholder} className="w-[200px]" />
        <Button variant="primary" onClick={onAdd}>
          {addLabel}
        </Button>
      </div>

      {/* ROW 2: Sort/Filters (left) | Per-page (right) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-2)",
          paddingTop: "var(--space-3)",
          paddingBottom: "var(--space-3)",
          borderBottom: "1px solid var(--color-row-divider)",
        }}
      >
        {/* Left side: Sort + Direction + Filter dropdowns + Clear */}
        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
          <Select options={sortFields} value={sortField} onChange={onSortField} size="auto" />
          <SortDirButton dir={sortDir} onClick={onSortDir} />
          {filters?.map((f, i) => (
            <Select key={i} options={f.options} value={f.value} onChange={f.onChange} size="auto" />
          ))}
          {filtersActive && onClearFilters && (
            <Button variant="ghost" className="h-9" onClick={onClearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Right side: Per-page selector */}
        <Select
          options={PER_PAGE_OPTIONS}
          value={String(perPage)}
          onChange={(v) => onPerPage(Number(v))}
          size="auto"
        />
      </div>

      {/* ROW 3: Count label (left-aligned) */}
      {isLoaded && count !== undefined && (
        <div
          className="font-sans uppercase"
          style={{
            fontSize: "var(--text-sm)",
            letterSpacing: "var(--tracking-md)",
            color: "var(--color-meta-text)",
            marginTop: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          {count} {count === 1 ? countLabel : `${countLabel}s`}
        </div>
      )}
    </div>
  );
}
