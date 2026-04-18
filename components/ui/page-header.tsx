"use client";

import { useState } from "react";
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
  filterDropdowns?: FilterBarFilter[];
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
  filterDropdowns,
  filtersActive,
  onClearFilters,
  perPage,
  onPerPage,
  count,
  countLabel,
  isLoaded,
}: PageHeaderProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

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

      {/* ROW 2: Sort + Filters button */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div
          className="flex items-center flex-wrap relative"
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

          {/* Filters button + dropdown panel */}
          <div style={{ position: "relative" }}>
            <Button
              variant="primary"
              className="px-4 rounded-[3px] text-[13px] leading-none tracking-[0.08em] bg-transparent border border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-sand-light)] min-h-8 h-auto"
              style={{ height: "36px" }}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <SlidersHorizontal size={13} />
              Filters
            </Button>

            {/* Filter dropdown panel */}
            {filtersOpen && filterDropdowns && filterDropdowns.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "var(--space-1)",
                  background: "var(--color-cream-dark)",
                  border: "1px solid var(--color-row-divider)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-3)",
                  zIndex: 10,
                  minWidth: "200px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                }}
              >
                {filterDropdowns.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: i < filterDropdowns.length - 1 ? "var(--space-3)" : 0,
                    }}
                  >
                    <Select
                      options={f.options}
                      value={f.value}
                      onChange={(v) => {
                        f.onChange(v);
                      }}
                      size="auto"
                    />
                  </div>
                ))}
                {filtersActive && onClearFilters && (
                  <Button
                    variant="ghost"
                    className="mt-3 text-[11px] text-[var(--color-navy)]"
                    onClick={() => {
                      onClearFilters();
                      setFiltersOpen(false);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: Count label (left) + Per-page toggle (right) */}
      {isLoaded && count !== undefined && (
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "var(--space-4)" }}
        >
          <div
            className="font-sans uppercase"
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-weight-medium)",
              letterSpacing: "var(--tracking-md)",
              color: "var(--color-navy)",
            }}
          >
            {count} {count === 1 ? countLabel : `${countLabel}s`}
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
      )}
    </div>
  );
}
