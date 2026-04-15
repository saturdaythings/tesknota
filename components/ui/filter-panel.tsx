"use client";

import { useState } from "react";
import { FilterBar, FilterChip } from "@/components/ui/filter-bar";

interface FilterPanelProps {
  filters: {
    accord: string;
    rating: number | null;
    house: string;
    status: string;
  };
  allAccords: string[];
  allHouses: string[];
  statusOptions: { label: string; value: string }[];
  onFilterChange: (updates: Record<string, unknown>) => void;
  onPageReset?: () => void;
}

const dropdownBase: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  zIndex: "var(--z-dropdown)" as unknown as number,
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-md)",
  minWidth: "180px",
};

const dropItemBase =
  "w-full text-left px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] transition-colors cursor-pointer hover:bg-[var(--color-surface-raised)]";

export function FilterPanel({
  filters,
  allAccords,
  allHouses,
  statusOptions,
  onFilterChange,
  onPageReset,
}: FilterPanelProps) {
  const [accordSearch, setAccordSearch] = useState("");
  const [accordDDOpen, setAccordDDOpen] = useState(false);
  const [ratingDDOpen, setRatingDDOpen] = useState(false);
  const [houseDDOpen, setHouseDDOpen] = useState(false);

  const handleAccordChange = (accord: string) => {
    onFilterChange({ accord });
    setAccordDDOpen(false);
    setAccordSearch("");
    onPageReset?.();
  };

  const handleRatingChange = (rating: number | null) => {
    onFilterChange({ rating });
    setRatingDDOpen(false);
    onPageReset?.();
  };

  const handleHouseChange = (house: string) => {
    onFilterChange({ house });
    setHouseDDOpen(false);
    onPageReset?.();
  };

  const handleStatusChange = (status: string) => {
    onFilterChange({ status });
    onPageReset?.();
  };

  const triggerBase =
    "text-[length:var(--text-xs)] font-medium px-[var(--space-3)] h-9 border rounded-[var(--radius-sm)] transition-[border-color,color] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-2)",
        marginBottom: "var(--space-4)",
        padding: "var(--space-3) var(--space-3)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {/* Accords dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setAccordDDOpen((o) => !o);
            setRatingDDOpen(false);
            setHouseDDOpen(false);
          }}
          className={`${triggerBase} ${
            filters.accord
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          {filters.accord || "Accords"} &#9662;
        </button>
        {accordDDOpen && (
          <div style={{ ...dropdownBase, width: "200px" }}>
            <div
              style={{
                padding: "var(--space-2)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <input
                value={accordSearch}
                onChange={(e) => setAccordSearch(e.target.value)}
                placeholder="Search accords..."
                style={{
                  width: "100%",
                  padding: "var(--space-1) var(--space-2)",
                  fontSize: "var(--text-xs)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ overflowY: "auto", maxHeight: "220px" }}>
              {allAccords
                .filter(
                  (a) =>
                    !accordSearch ||
                    a.toLowerCase().includes(accordSearch.toLowerCase()),
                )
                .map((a) => (
                  <button
                    key={a}
                    onClick={() => handleAccordChange(a)}
                    style={{
                      color:
                        filters.accord === a
                          ? "var(--color-accent)"
                          : "var(--color-text-secondary)",
                      background:
                        filters.accord === a
                          ? "var(--color-accent-subtle)"
                          : undefined,
                    }}
                    className={dropItemBase}
                  >
                    {a}
                  </button>
                ))}
            </div>
            <button
              onClick={() => handleAccordChange("")}
              className="text-label w-full text-left px-[var(--space-3)] py-[var(--space-2)] border-t border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] cursor-pointer"
              style={{ color: "var(--color-text-muted)" }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Rating dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setRatingDDOpen((o) => !o);
            setAccordDDOpen(false);
            setHouseDDOpen(false);
          }}
          className={`${triggerBase} ${
            filters.rating !== null
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          {filters.rating !== null ? `${filters.rating}+ stars` : "Rating"}{" "}
          &#9662;
        </button>
        {ratingDDOpen && (
          <div style={{ ...dropdownBase, width: "160px" }}>
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => handleRatingChange(r)}
                style={{
                  color:
                    filters.rating === r
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                  background:
                    filters.rating === r
                      ? "var(--color-accent-subtle)"
                      : undefined,
                }}
                className={dropItemBase}
              >
                {r}+ stars
              </button>
            ))}
            <button
              onClick={() => handleRatingChange(null)}
              className="text-label w-full text-left px-[var(--space-3)] py-[var(--space-2)] border-t border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] cursor-pointer"
              style={{ color: "var(--color-text-muted)" }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Houses dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => {
            setHouseDDOpen((o) => !o);
            setAccordDDOpen(false);
            setRatingDDOpen(false);
          }}
          className={`${triggerBase} ${
            filters.house
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
          }`}
        >
          {filters.house || "Houses"} &#9662;
        </button>
        {houseDDOpen && (
          <div
            style={{
              ...dropdownBase,
              width: "220px",
              maxHeight: "280px",
              overflowY: "auto",
            }}
          >
            {allHouses.map((h) => (
              <button
                key={h}
                onClick={() => handleHouseChange(h)}
                style={{
                  color:
                    filters.house === h
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                  background:
                    filters.house === h
                      ? "var(--color-accent-subtle)"
                      : undefined,
                }}
                className={dropItemBase}
              >
                {h}
              </button>
            ))}
            <button
              onClick={() => handleHouseChange("")}
              className="text-label w-full text-left px-[var(--space-3)] py-[var(--space-2)] border-t border-[var(--color-border)] hover:bg-[var(--color-surface-raised)] cursor-pointer"
              style={{ color: "var(--color-text-muted)" }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Status chips */}
      <FilterBar className="mb-0">
        {statusOptions.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={filters.status === f.value}
            onClick={() => handleStatusChange(f.value)}
          />
        ))}
      </FilterBar>
    </div>
  );
}
