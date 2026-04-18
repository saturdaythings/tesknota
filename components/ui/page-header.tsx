"use client";

import { ArrowUp, ArrowDown, SlidersHorizontal } from "lucide-react";
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
  searchValue: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  addLabel: string;
  onAdd: () => void;

  sortFields: FilterBarSortOption[];
  sortField: string;
  onSortField: (v: string) => void;
  sortDir: "asc" | "desc";
  onSortDir: () => void;
  filters?: FilterBarFilter[];
  filtersActive: boolean;
  onClearFilters?: () => void;

  perPage: number;
  onPerPage: (v: number) => void;

  count?: number;
  countLabel: string;
  isLoaded?: boolean;
}

const PER_PAGE_VALUES: number[] = [25, 50, 0];

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
  return (
    <div>
      {/* ROW 1: Search + Add (right-aligned) */}
      <div
        className="flex items-center justify-end gap-3"
        style={{ marginBottom: "var(--space-8)" }}
      >
        <SearchInput
          value={searchValue}
          onChange={onSearch}
          placeholder={searchPlaceholder}
          className="w-[220px]"
        />
        <Button
          variant="primary"
          className="px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] bg-[var(--color-navy)] text-[var(--color-cream)] hover:bg-[var(--color-accent)] min-h-10 h-auto border-0"
          onClick={onAdd}
        >
          {addLabel}
        </Button>
      </div>

      {/* ROW 2: Sort + Filters (left) | Per-page toggle (right) */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div
          className="flex items-center justify-between flex-wrap"
          style={{ gap: "var(--space-3)" }}
        >
          <div
            className="flex items-center flex-wrap"
            style={{ gap: "var(--space-2)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-1)",
              }}
            >
              <Select
                options={sortFields}
                value={sortField}
                onChange={onSortField}
                size="auto"
              />
              <Button
                variant="ghost"
                className="p-0 rounded-[3px] bg-transparent text-[var(--color-navy)] hover:bg-[var(--color-sand-light)] hover:text-[var(--color-navy)]"
                style={{ width: "36px", height: "36px" }}
                title={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
                aria-label={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
                onClick={onSortDir}
              >
                {sortDir === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </Button>
            </div>
            <Button
              variant="primary"
              className="px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] bg-transparent border border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-sand-light)] min-h-8 h-auto"
              style={{ height: "36px" }}
              onClick={onClearFilters}
              disabled={!filtersActive}
            >
              <SlidersHorizontal size={13} />
              Filters
            </Button>
            {filters?.map((f, i) => (
              <Select
                key={i}
                options={f.options}
                value={f.value}
                onChange={f.onChange}
                size="auto"
              />
            ))}
          </div>

          <div className="flex items-center" style={{ gap: "var(--space-1)" }}>
            <span
              className="font-sans"
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--color-navy)",
                letterSpacing: "var(--tracking-sm)",
                marginRight: "var(--space-1)",
              }}
            >
              Per page:
            </span>
            {PER_PAGE_VALUES.map((n, i) => {
              const active = perPage === n;
              return (
                <span
                  key={n}
                  className="flex items-center"
                  style={{ gap: "var(--space-1)" }}
                >
                  {i > 0 && (
                    <span
                      className="font-sans select-none"
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-navy)",
                        opacity: 0.35,
                      }}
                    >
                      |
                    </span>
                  )}
                  <button
                    type="button"
                    className="font-sans"
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--color-navy)",
                      fontWeight: active
                        ? "var(--font-weight-semibold)"
                        : "var(--font-weight-normal)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0 var(--space-1)",
                      letterSpacing: "var(--tracking-sm)",
                    }}
                    onClick={() => onPerPage(n)}
                  >
                    {n === 0 ? "All" : n}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 3: Count label */}
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
