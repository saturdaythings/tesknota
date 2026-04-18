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

interface PageFilterBarProps {
  searchValue: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;

  addLabel?: string;
  onAdd?: () => void;

  sortFields: FilterBarSortOption[];
  sortField: string;
  onSortField: (v: string) => void;
  sortDir: "asc" | "desc";
  onSortDir: () => void;

  filters?: FilterBarFilter[];
  filterPanel?: React.ReactNode;
  filtersActive: boolean;
  onClearFilters?: () => void;

  perPage: number;
  onPerPage: (v: number) => void;

  count?: number;
  countLabel?: string;
  isLoaded?: boolean;
}

const PER_PAGE_OPTIONS = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

function SortDirButton({ dir, onClick }: { dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <Button
      variant="secondary"
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

export function PageFilterBar({
  searchValue, onSearch, searchPlaceholder = "Search...",
  addLabel, onAdd,
  sortFields, sortField, onSortField, sortDir, onSortDir,
  filters, filterPanel, filtersActive, onClearFilters,
  perPage, onPerPage,
  count, countLabel = "Item", isLoaded,
}: PageFilterBarProps) {
  return (
    <div>
      <div
        className="flex items-center justify-between flex-wrap"
        style={{
          gap: "var(--space-2)",
          paddingBottom: "var(--space-3)",
          borderBottom: "1px solid var(--color-row-divider)",
        }}
      >
        <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
          <SearchInput
            value={searchValue}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            className="w-[200px]"
          />
          {filters?.map((f, i) => (
            <Select key={i} options={f.options} value={f.value} onChange={f.onChange} size="auto" />
          ))}
          {filterPanel}
          {filtersActive && onClearFilters && (
            <Button variant="ghost" className="h-9" onClick={onClearFilters}>
              Clear
            </Button>
          )}
          <Select options={sortFields} value={sortField} onChange={onSortField} size="auto" />
          <SortDirButton dir={sortDir} onClick={onSortDir} />
          <Select
            options={PER_PAGE_OPTIONS}
            value={String(perPage)}
            onChange={(v) => onPerPage(Number(v))}
            size="auto"
          />
        </div>
        {addLabel && onAdd && <Button variant="primary" onClick={onAdd}>{addLabel}</Button>}
      </div>

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
