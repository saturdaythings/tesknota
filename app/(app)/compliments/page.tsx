"use client";

import { useState, useMemo, Suspense } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';

import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { AddFragranceModal } from '@/components/collection/add-fragrance-modal';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import type { UserCompliment, Relation, FragranceType } from '@/types';
import { MessageCircle } from '@/components/ui/Icons';

// ── Constants ──────────────────────────────────────────────

const MONTH_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

const RELATION_TABS: { label: string; value: Relation | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Strangers', value: 'Stranger' },
  { label: 'Friends', value: 'Friend' },
  { label: 'Colleagues', value: 'Colleague / Client' },
  { label: 'Family', value: 'Family' },
  { label: 'Partners', value: 'Significant Other' },
  { label: 'Other', value: 'Other' },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Date — Newest first' },
  { value: 'date-asc', label: 'Date — Oldest first' },
  { value: 'frag-az', label: 'Fragrance A–Z' },
];

// ── Helpers ────────────────────────────────────────────────

function compSortNum(c: UserCompliment): number {
  if (c.createdAt) return new Date(c.createdAt).getTime();
  return parseInt(c.year || '0') * 100 + parseInt(c.month || '0');
}

function formatDate(c: UserCompliment): string {
  if (c.createdAt) {
    const d = new Date(c.createdAt);
    if (!isNaN(d.getTime())) return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  }
  const mn = parseInt(c.month, 10);
  const label = mn >= 1 && mn <= 12 ? MONTH_SHORT[mn - 1] : c.month;
  return c.year ? `${label} ${c.year}` : label;
}

function buildMeta(c: UserCompliment): string {
  const parts: string[] = [];
  if (c.relation) parts.push(c.relation.toUpperCase());
  if (c.gender) parts.push(c.gender.toUpperCase());
  const loc = [c.location, c.city, c.state || c.country]
    .filter(Boolean)
    .join(', ')
    .toUpperCase();
  if (loc) parts.push(loc);
  return parts.join(' · ');
}

// ── Sub-components ─────────────────────────────────────────

interface ComplimentRowProps {
  comp: UserCompliment;
  fragName: string;
  fragHouse: string;
  fragType: FragranceType | null;
  onEdit: () => void;
}

function ComplimentRow({ comp, fragName, fragHouse, fragType, onEdit }: ComplimentRowProps) {
  const meta = buildMeta(comp);
  const date = formatDate(comp);

  return (
    <div
      onClick={onEdit}
      className="flex gap-6 items-start cursor-pointer transition-colors duration-100 max-sm:flex-col max-sm:gap-2"
      style={{
        minHeight: '80px',
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--color-row-divider)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Column 1: Fragrance — fixed width keeps visual gap to col 2 consistent at all viewports */}
      <div style={{ width: '220px', flexShrink: 0 }}>
        <FragranceCell
          name={fragName}
          house={fragHouse}
          type={fragType}
          secondary={comp.secondaryFrag ?? undefined}
        />
      </div>

      {/* Column 2: Meta + Notes */}
      <div className="flex-1 min-w-0">
        {meta && (
          <div
            className="font-sans uppercase mb-1"
            style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-meta-text)' }}
          >
            {meta}
          </div>
        )}
        {comp.notes && (
          <div
            className="font-serif italic line-clamp-2"
            style={{ fontSize: 'var(--text-note)', color: 'var(--color-notes-text)', lineHeight: 1.6 }}
          >
            {comp.notes}
          </div>
        )}
      </div>

      {/* Column 3: Date */}
      <div
        className="font-sans uppercase flex-shrink-0 text-right"
        style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-navy)', minWidth: '72px' }}
      >
        {date}
      </div>
    </div>
  );
}

function EmptyCompliments({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <MessageCircle size={40} style={{ color: 'var(--color-navy)', marginBottom: 'var(--space-4)' }} />
      <div
        className="font-serif italic mb-2"
        style={{ fontSize: 'var(--text-empty-title)', color: 'var(--color-navy)' }}
      >
        No compliments yet
      </div>
      <div
        className="font-sans mb-6"
        style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)', maxWidth: '280px' }}
      >
        Start logging when someone notices your fragrance.
      </div>
      <Button variant="primary" onClick={onAdd}>
        Log First Compliment
      </Button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

function ComplimentsInner() {
  const { user } = useUser();
  const { compliments, fragrances, isLoaded } = useData();

  const [logOpen, setLogOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<UserCompliment | null>(null);
  const [addFragOpen, setAddFragOpen] = useState(false);
  const [relationTab, setRelationTab] = useState<Relation | 'ALL'>('ALL');
  const [sort, setSort] = useState('date-desc');
  const [search, setSearch] = useState('');

  if (!user) return null;

  const myComps = compliments.filter((c) => c.userId === user.id);
  const myFrags = fragrances.filter((f) => f.userId === user.id);

  const fragById = new Map(myFrags.map((f) => [f.fragranceId || f.id, f]));

  function getFragInfo(comp: UserCompliment) {
    const f = fragById.get(comp.primaryFragId ?? '') ?? null;
    return {
      name: f?.name ?? comp.primaryFrag ?? '-',
      house: f?.house ?? '',
      type: f?.type ?? null,
    };
  }

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: myComps.length };
    for (const c of myComps) {
      map[c.relation] = (map[c.relation] ?? 0) + 1;
    }
    return map;
  }, [myComps]);

  const displayed = useMemo(() => {
    let result = relationTab === 'ALL' ? myComps : myComps.filter((c) => c.relation === relationTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) =>
        (c.primaryFrag ?? '').toLowerCase().includes(q) ||
        (c.secondaryFrag ?? '').toLowerCase().includes(q) ||
        (c.notes ?? '').toLowerCase().includes(q),
      );
    }
    if (sort === 'date-desc') result = [...result].sort((a, b) => compSortNum(b) - compSortNum(a));
    else if (sort === 'date-asc') result = [...result].sort((a, b) => compSortNum(a) - compSortNum(b));
    else if (sort === 'frag-az') result = [...result].sort((a, b) => (a.primaryFrag ?? '').localeCompare(b.primaryFrag ?? ''));
    return result;
  }, [myComps, relationTab, sort, search]);

  return (
    <>
      <LogComplimentModal
        open={logOpen}
        onClose={() => setLogOpen(false)}
      />
      <LogComplimentModal
        open={!!editingComp}
        onClose={() => setEditingComp(null)}
        editing={editingComp}
      />
      <AddFragranceModal open={addFragOpen} onClose={() => setAddFragOpen(false)} />

      <Topbar
        title="Compliments"
        actions={
          <div
            onClick={() => setAddFragOpen(true)}
            className="relative flex items-center cursor-pointer"
            style={{ width: '200px' }}
          >
            <Search
              size={15}
              className="absolute left-3 pointer-events-none"
              style={{ color: 'var(--color-meta-text)' }}
            />
            <div
              className="w-full h-9 pl-9 pr-3 flex items-center rounded-[2px] font-sans"
              style={{
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.08em',
                background: 'var(--color-cream)',
                border: '1px solid var(--color-meta-text)',
                color: 'var(--color-meta-text)',
              }}
            >
              Find fragrances...
            </div>
          </div>
        }
        search={
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '10px', color: 'var(--color-cream-faint)', pointerEvents: 'none' }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: '200px',
                height: '34px',
                paddingLeft: '30px',
                paddingRight: '10px',
                background: 'var(--color-white-subtle)',
                border: '1px solid var(--color-white-dim)',
                borderRadius: '3px',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-cream)',
                outline: 'none',
              }}
              className="placeholder:text-[var(--color-cream-faint)] focus:border-[var(--color-white-mid)]"
            />
          </div>
        }
      />

      <PageContent>
        {/* Page header row */}
        <div className="flex items-center justify-end mb-8">
          <Button variant="primary" onClick={() => setLogOpen(true)}>
            Log Compliment
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6 max-sm:flex-col">
          <div className="flex flex-wrap gap-2">
            {RELATION_TABS.map((tab) => (
              <TabPill
                key={tab.value}
                label={tab.label}
                count={tabCounts[tab.value] ?? 0}
                active={relationTab === tab.value}
                onClick={() => setRelationTab(tab.value)}
              />
            ))}
          </div>
          <div className="max-sm:w-full max-sm:mt-3" style={{ flexShrink: 0, marginLeft: 'auto' }}>
            <Select
              options={SORT_OPTIONS}
              value={sort}
              onChange={setSort}
              size="auto"
            />
          </div>
        </div>

        {/* List */}
        {!isLoaded ? (
          <div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '80px',
                  borderBottom: '1px solid var(--color-row-divider)',
                  background: 'var(--color-row-hover)',
                  borderRadius: '3px',
                  marginBottom: 'var(--space-1)',
                }}
              />
            ))}
          </div>
        ) : myComps.length === 0 ? (
          <EmptyCompliments onAdd={() => setLogOpen(true)} />
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center">
            <div className="font-sans" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)' }}>
              No compliments match this filter.
            </div>
          </div>
        ) : (
          <div>
            {displayed.map((comp) => {
              const { name, house, type } = getFragInfo(comp);
              return (
                <ComplimentRow
                  key={comp.id}
                  comp={comp}
                  fragName={name}
                  fragHouse={house}
                  fragType={type}
                  onEdit={() => setEditingComp(comp)}
                />
              );
            })}
          </div>
        )}
      </PageContent>
    </>
  );
}

export default function ComplimentsPage() {
  return (
    <Suspense>
      <ComplimentsInner />
    </Suspense>
  );
}
