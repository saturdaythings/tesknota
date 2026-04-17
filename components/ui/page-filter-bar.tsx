"use client";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { SortControl } from "@/components/ui/sort-control";
import { PerPageControl } from "@/components/ui/per-page-control";
import { SlidersHorizontal, X } from "@/components/ui/Icons";

export interface FilterBarSortOption {
  value: string;
  label: string;
}

interface PageFilterBarProps {
  // Action row
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  action: React.ReactNode;

  // Sort
  sortField: string;
  sortDir: "asc" | "desc";
  sortOptions: FilterBarSortOption[];
  onSortField: (v: string) => void;
  onToggleSortDir: () => void;

  // Optional: collapsible filter panel (Collection)
  filtersOpen?: boolean;
  onFiltersOpen?: (v: boolean) => void;
  filtersActive?: boolean;
  onClearFilters?: () => void;
  filterPanel?: React.ReactNode;

  // Optional: always-visible filter pills (Compliments tabs)
  pills?: React.ReactNode;

  // Per-page (omit to hide PerPageControl)
  perPage?: number;
  onPerPage?: (v: number) => void;

  // Count display
  count?: number;
  countLabel?: string;
  isLoaded?: boolean;
}

export function PageFilterBar({
  search, onSearch, searchPlaceholder = "Search...",
  action,
  sortField, sortDir, sortOptions, onSortField, onToggleSortDir,
  filtersOpen, onFiltersOpen, filtersActive, onClearFilters, filterPanel,
  pills,
  perPage, onPerPage,
  count, countLabel = "Item", isLoaded,
}: PageFilterBarProps) {
  const hasFilterToggle = !!onFiltersOpen;
  const showPerPage = onPerPage !== undefined && perPage !== undefined;

  return (
    <div>
      {/* Row 1: search + action button */}
      <div
        className="flex items-center justify-end gap-3"
        style={{ marginBottom: "var(--space-8)" }}
      >
        <SearchInput
          value={search}
          onChange={onSearch}
          placeholder={searchPlaceholder}
          className="w-[220px]"
        />
        {action}
      </div>

      {/* Filter bar */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        {/* Row 2: sort + pills + filter toggle + per-page */}
        <div
          className="flex items-center justify-between flex-wrap"
          style={{
            gap: "var(--space-3)",
            marginBottom: filtersOpen && filterPanel ? "var(--space-3)" : undefined,
          }}
        >
          <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)" }}>
            <SortControl
              field={sortField}
              direction={sortDir}
              options={sortOptions}
              onField={onSortField}
              onToggleDirection={onToggleSortDir}
            />
            {pills}
            {hasFilterToggle && (
              <Button
                variant="secondary"
                size="sm"
                style={{ height: "36px" }}
                onClick={() => onFiltersOpen!(!filtersOpen)}
              >
                <SlidersHorizontal size={13} />
                Filters
              </Button>
            )}
            {filtersActive && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                style={{ height: "36px" }}
                onClick={onClearFilters}
              >
                <X size={13} />
                Clear
              </Button>
            )}
          </div>
          {showPerPage && (
            <PerPageControl value={perPage!} onChange={onPerPage!} />
          )}
        </div>

        {/* Row 3: expanded filter panel */}
        {filtersOpen && filterPanel && (
          <div
            className="flex flex-wrap"
            style={{
              gap: "var(--space-2)",
              paddingTop: "var(--space-3)",
              borderTop: "1px solid var(--color-row-divider)",
            }}
          >
            {filterPanel}
          </div>
        )}
      </div>

      {/* Count */}
      {isLoaded && count !== undefined && (
        <div
          className="font-sans uppercase"
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: "var(--font-weight-medium)",
            letterSpacing: "var(--tracking-md)",
            color: "var(--color-navy)",
            marginBottom: "var(--space-4)",
          }}
        >
          {count} {count === 1 ? countLabel : `${countLabel}s`}
        </div>
      )}
    </div>
  );
}
