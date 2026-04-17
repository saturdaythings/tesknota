"use client";

import { TabPill } from '@/components/ui/tab-pill';
import { PerPageControl } from '@/components/ui/per-page-control';
import { SortControl } from '@/components/ui/sort-control';
import { RELATION_TABS, SORT_FIELD_OPTIONS } from '@/lib/compliment-utils';
import type { Relation } from '@/types';

interface ComplimentFiltersProps {
  relationTab: Relation | 'ALL';
  onRelationTab: (v: Relation | 'ALL') => void;
  tabCounts: Record<string, number>;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSortField: (v: string) => void;
  onToggleSortDir: () => void;
  perPage: number;
  onPerPage: (v: number) => void;
}

export function ComplimentFilters({
  relationTab, onRelationTab, tabCounts,
  sortField, sortDir, onSortField, onToggleSortDir,
  perPage, onPerPage,
}: ComplimentFiltersProps) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      <div
        className="flex items-start justify-between gap-4 flex-wrap max-sm:flex-col"
        style={{ marginBottom: 'var(--space-3)' }}
      >
        <div className="flex flex-wrap gap-2">
          {RELATION_TABS.map((tab) => (
            <TabPill
              key={tab.value}
              label={tab.label}
              count={tabCounts[tab.value] ?? 0}
              active={relationTab === tab.value}
              onClick={() => onRelationTab(tab.value)}
            />
          ))}
        </div>
        <div style={{ flexShrink: 0 }}>
          <PerPageControl value={perPage} onChange={onPerPage} />
        </div>
      </div>
      <SortControl
        field={sortField}
        direction={sortDir}
        options={SORT_FIELD_OPTIONS}
        onField={onSortField}
        onToggleDirection={onToggleSortDir}
      />
    </div>
  );
}
