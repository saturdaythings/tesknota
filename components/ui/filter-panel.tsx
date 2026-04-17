"use client";

import { useState, useRef, useEffect } from "react";
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
  onFilterChange: (updates: Record<string, any>) => void;
  onPageReset?: () => void;
}

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
  const accordRef = useRef<HTMLDivElement>(null);
  const ratingRef = useRef<HTMLDivElement>(null);
  const houseRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!accordDDOpen && !ratingDDOpen && !houseDDOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (accordRef.current && !accordRef.current.contains(e.target as Node)) {
        setAccordDDOpen(false);
      }
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setRatingDDOpen(false);
      }
      if (houseRef.current && !houseRef.current.contains(e.target as Node)) {
        setHouseDDOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [accordDDOpen, ratingDDOpen, houseDDOpen]);

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

  return (
    <div className="flex flex-wrap items-start gap-2 mb-4 py-3 border border-[var(--b2)] px-3">
      {/* Accords dropdown */}
      <div className="relative" ref={accordRef}>
        <button
          onClick={() => {
            setAccordDDOpen((o) => !o);
            setRatingDDOpen(false);
            setHouseDDOpen(false);
          }}
          className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${
            filters.accord
              ? "border-[var(--blue)] text-[var(--blue)]"
              : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
          }`}
        >
          {filters.accord || "Accords"} &#9662;
        </button>
        {accordDDOpen && (
          <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[200px]">
            <div className="p-2 border-b border-[var(--b2)]">
              <input
                value={accordSearch}
                onChange={(e) => setAccordSearch(e.target.value)}
                placeholder="Search accords..."
                className="w-full px-2 py-1 text-xs font-[var(--mono)] border border-[var(--b3)] bg-[var(--off)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] placeholder:text-[var(--color-navy-mid)]"
              />
            </div>
            <div className="overflow-y-auto max-h-[220px]">
              {allAccords
                .filter(
                  (a) =>
                    !accordSearch ||
                    a.toLowerCase().includes(accordSearch.toLowerCase())
                )
                .map((a) => (
                  <button
                    key={a}
                    onClick={() => handleAccordChange(a)}
                    className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${
                      filters.accord === a
                        ? "text-[var(--blue)] bg-[var(--blue-tint)]"
                        : "text-[var(--ink2)] hover:bg-[var(--b1)]"
                    }`}
                  >
                    {a}
                  </button>
                ))}
            </div>
            <button
              onClick={() => handleAccordChange("")}
              className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left"
            >
              CLEAR
            </button>
          </div>
        )}
      </div>

      {/* Rating dropdown */}
      <div className="relative" ref={ratingRef}>
        <button
          onClick={() => {
            setRatingDDOpen((o) => !o);
            setAccordDDOpen(false);
            setHouseDDOpen(false);
          }}
          className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${
            filters.rating !== null
              ? "border-[var(--blue)] text-[var(--blue)]"
              : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
          }`}
        >
          {filters.rating !== null ? `${filters.rating}+ stars` : "Rating"}{" "}
          &#9662;
        </button>
        {ratingDDOpen && (
          <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[160px]">
            {[5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => handleRatingChange(r)}
                className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${
                  filters.rating === r
                    ? "text-[var(--blue)] bg-[var(--blue-tint)]"
                    : "text-[var(--ink2)] hover:bg-[var(--b1)]"
                }`}
              >
                {r}+ stars
              </button>
            ))}
            <button
              onClick={() => handleRatingChange(null)}
              className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left"
            >
              CLEAR
            </button>
          </div>
        )}
      </div>

      {/* Houses dropdown */}
      <div className="relative" ref={houseRef}>
        <button
          onClick={() => {
            setHouseDDOpen((o) => !o);
            setAccordDDOpen(false);
            setRatingDDOpen(false);
          }}
          className={`font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors ${
            filters.house
              ? "border-[var(--blue)] text-[var(--blue)]"
              : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
          }`}
        >
          {filters.house || "Houses"} &#9662;
        </button>
        {houseDDOpen && (
          <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[220px] max-h-[280px] overflow-y-auto">
            {allHouses.map((h) => (
              <button
                key={h}
                onClick={() => handleHouseChange(h)}
                className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${
                  filters.house === h
                    ? "text-[var(--blue)] bg-[var(--blue-tint)]"
                    : "text-[var(--ink2)] hover:bg-[var(--b1)]"
                }`}
              >
                {h}
              </button>
            ))}
            <button
              onClick={() => handleHouseChange("")}
              className="w-full font-[var(--mono)] text-xs tracking-[0.08em] uppercase text-[var(--ink4)] hover:text-[var(--blue)] px-3 py-2 border-t border-[var(--b2)] text-left"
            >
              CLEAR
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
