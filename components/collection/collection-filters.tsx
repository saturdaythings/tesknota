"use client";

import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchInput } from '@/components/ui/search-input';
import { PerPageControl } from '@/components/ui/per-page-control';
import { SlidersHorizontal, X } from '@/components/ui/Icons';
import { SORT_OPTIONS, RATING_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '@/lib/collection-utils';

interface CollectionFiltersProps {
  search: string;
  onSearch: (v: string) => void;
  sort: string;
  onSort: (v: string) => void;
  filtersOpen: boolean;
  onFiltersOpen: (v: boolean) => void;
  accordFilter: string[];
  onAccordFilter: (v: string[]) => void;
  ratingFilter: string;
  onRatingFilter: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  houseFilter: string[];
  onHouseFilter: (v: string[]) => void;
  accordOptions: { value: string; label: string }[];
  houseOptions: { value: string; label: string }[];
  filtersActive: boolean;
  onClearFilters: () => void;
  perPage: number;
  onPerPage: (v: number) => void;
}

export function CollectionFilters({
  search, onSearch,
  sort, onSort,
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
      {/* Row 1: search + sort + per-page + filters toggle */}
      <div
        className="flex items-center flex-wrap max-sm:flex-col max-sm:items-stretch"
        style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}
      >
        <div style={{ width: '280px' }} className="max-sm:w-full">
          <SearchInput value={search} onChange={onSearch} placeholder="Search fragrances..." />
        </div>

        <div style={{ width: '200px' }} className="max-sm:w-full">
          <Select options={SORT_OPTIONS} value={sort} onChange={onSort} />
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <PerPageControl value={perPage} onChange={onPerPage} />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFiltersOpen(!filtersOpen)}
          style={{ borderColor: filtersOpen ? 'var(--color-navy)' : undefined }}
        >
          <SlidersHorizontal size={13} />
          {filtersOpen ? '- Filters' : '+ Filters'}
        </Button>

        {filtersActive && (
          <button
            onClick={onClearFilters}
            className="flex items-center font-sans"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-sm)',
              color: 'var(--color-meta-text)',
              gap: 'var(--space-1)',
              padding: 0,
            }}
          >
            <X size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Row 2: expanded filters */}
      {filtersOpen && (
        <div
          className="flex flex-wrap"
          style={{
            gap: 'var(--space-2)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--color-sand-light)',
          }}
        >
          <div style={{ width: '160px' }}>
            <MultiSelect options={accordOptions} value={accordFilter} onChange={onAccordFilter} placeholder="Accords" />
          </div>
          <div style={{ width: '160px' }}>
            <Select options={RATING_FILTER_OPTIONS} value={ratingFilter} onChange={onRatingFilter} placeholder="Rating" />
          </div>
          <div style={{ width: '180px' }}>
            <Select options={STATUS_FILTER_OPTIONS} value={statusFilter} onChange={onStatusFilter} placeholder="Status" />
          </div>
          <div style={{ width: '160px' }}>
            <MultiSelect options={houseOptions} value={houseFilter} onChange={onHouseFilter} placeholder="Houses" />
          </div>
        </div>
      )}
    </div>
  );
}
