"use client";

import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { PerPageControl } from '@/components/ui/per-page-control';
import { SortControl } from '@/components/ui/sort-control';
import { SlidersHorizontal, X } from '@/components/ui/Icons';
import { SORT_FIELD_OPTIONS, RATING_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '@/lib/collection-utils';
import { Select } from '@/components/ui/select';
import type { SortField, SortDir } from '@/lib/collection-utils';

interface CollectionFiltersProps {
  sortField: SortField;
  sortDir: SortDir;
  onSortField: (v: SortField) => void;
  onToggleSortDir: () => void;
  filtersOpen: boolean;
  onFiltersOpen: (v: boolean) => void;
  accordFilter: string[];
  onAccordFilter: (v: string[]) => void;
  ratingFilter: string;
  onRatingFilter: (v: string) => void;
  statusFilter: string[];
  onStatusFilter: (v: string[]) => void;
  houseFilter: string[];
  onHouseFilter: (v: string[]) => void;
  accordOptions: { value: string; label: string }[];
  houseOptions: { value: string; label: string }[];
  filtersActive: boolean;
  onClearFilters: () => void;
  perPage: number;
  onPerPage: (v: number) => void;
}

const STATUS_OPTIONS = STATUS_FILTER_OPTIONS.filter((o) => o.value !== 'all');

export function CollectionFilters({
  sortField, sortDir, onSortField, onToggleSortDir,
  filtersOpen, onFiltersOpen,
  accordFilter, onAccordFilter,
  ratingFilter, onRatingFilter,
  statusFilter, onStatusFilter,
  houseFilter, onHouseFilter,
  accordOptions, houseOptions,
  filtersActive, onClearFilters,
  perPage, onPerPage,
}: CollectionFiltersProps) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {/* Row 1: sort + filters left, per-page right */}
      <div
        className="flex items-center justify-between flex-wrap"
        style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <SortControl
            field={sortField}
            direction={sortDir}
            options={SORT_FIELD_OPTIONS}
            onField={(v) => onSortField(v as SortField)}
            onToggleDirection={onToggleSortDir}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onFiltersOpen(!filtersOpen)}
            style={{ borderColor: filtersOpen ? 'var(--color-navy)' : undefined }}
          >
            <SlidersHorizontal size={13} />
            Filters
          </Button>

          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X size={13} />
              Clear
            </Button>
          )}
        </div>

        <PerPageControl value={perPage} onChange={onPerPage} />
      </div>

      {/* Row 2: expanded filters */}
      {filtersOpen && (
        <div
          className="flex flex-wrap"
          style={{ gap: 'var(--space-2)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-row-divider)' }}
        >
          <div style={{ width: '160px' }}>
            <MultiSelect options={accordOptions} value={accordFilter} onChange={onAccordFilter} placeholder="Accords" />
          </div>
          <div style={{ width: '160px' }}>
            <Select options={RATING_FILTER_OPTIONS} value={ratingFilter} onChange={onRatingFilter} placeholder="Rating" />
          </div>
          <div style={{ width: '180px' }}>
            <MultiSelect options={STATUS_OPTIONS} value={statusFilter} onChange={onStatusFilter} placeholder="Status" />
          </div>
          <div style={{ width: '160px' }}>
            <MultiSelect options={houseOptions} value={houseFilter} onChange={onHouseFilter} placeholder="Houses" />
          </div>
        </div>
      )}
    </div>
  );
}
