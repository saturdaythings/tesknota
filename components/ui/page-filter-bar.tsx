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
    <button
      type="button"
      onClick={onClick}
      title={dir === "desc" ? "Sorted descending" : "Sorted ascending"}
      aria-label={dir === "desc" ? "Sorted descending" : "Sorted ascending"}
      style={{
        width: 28,
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        borderRadius: "var(--radius-md)",
      }}
    >
      {dir === "desc" ? (
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
          <line x1="6" y1="1" x2="6" y2="8" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="2" y1="5.5" x2="10" y2="5.5" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
          <polyline points="3,9.5 6,13 9,9.5" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
          <polyline points="3,4.5 6,1 9,4.5" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="2" y1="8.5" x2="10" y2="8.5" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="6" x2="6" y2="13" stroke="var(--color-navy)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
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
  const showAdd = addLabel != null && onAdd != null;
  return (
    <div
      style={{
        paddingBottom: "var(--space-3)",
        borderBottom: "1px solid var(--color-row-divider)",
        marginBottom: "var(--space-3)",
      }}
    >
      <div
        className="flex items-center"
        style={{ gap: "var(--space-2)", flexWrap: "nowrap", overflowX: "auto" }}
      >
        <SearchInput
          value={searchValue}
          onChange={onSearch}
          placeholder={searchPlaceholder}
          className="w-[200px] flex-shrink-0"
        />
        {filters?.map((f, i) => (
          <Select key={i} options={f.options} value={f.value} onChange={f.onChange} size="auto" />
        ))}
        {filterPanel}
        {filtersActive && onClearFilters && (
          <Button variant="ghost" size="sm" style={{ height: "36px", flexShrink: 0 }} onClick={onClearFilters}>
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
        <div style={{ flex: 1 }} />
        {isLoaded && count !== undefined && (
          <span
            className="font-sans uppercase flex-shrink-0"
            style={{
              fontSize: "var(--text-sm)",
              letterSpacing: "var(--tracking-md)",
              color: "var(--color-meta-text)",
            }}
          >
            {count} {count === 1 ? countLabel : `${countLabel}s`}
          </span>
        )}
        {showAdd && (
          <Button variant="primary" onClick={onAdd!} style={{ height: 36, flexShrink: 0 }}>
            + {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
