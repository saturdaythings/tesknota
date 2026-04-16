"use client";

import { TabPill } from '@/components/ui/tab-pill';
import { Select } from '@/components/ui/select';
import { PerPageControl } from '@/components/ui/per-page-control';
import { RELATION_TABS, SORT_OPTIONS } from '@/lib/compliment-utils';
import type { Relation } from '@/types';

interface ComplimentFiltersProps {
  relationTab: Relation | 'ALL';
  onRelationTab: (v: Relation | 'ALL') => void;
  tabCounts: Record<string, number>;
  sort: string;
  onSort: (v: string) => void;
  perPage: number;
  onPerPage: (v: number) => void;
}

export function ComplimentFilters({
  relationTab, onRelationTab, tabCounts, sort, onSort, perPage, onPerPage,
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
      <Select options={SORT_OPTIONS} value={sort} onChange={onSort} size="auto" />
    </div>
  );
}
