"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';

import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { FragSearch } from '@/components/ui/frag-search';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import type { UserCompliment, Relation, FragranceType } from '@/types';
import { MessageCircle, Search } from '@/components/ui/Icons';
import { Pagination } from '@/components/ui/pagination';
import { PerPageControl } from '@/components/ui/per-page-control';

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
      className="cursor-pointer transition-colors duration-100"
      style={{
        display: 'grid',
        gridTemplateColumns: 'subgrid',
        gridColumn: '1 / -1',
        alignItems: 'start',
        minHeight: '80px',
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--color-row-divider)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div>
        <FragranceCell
          name={fragName}
          house={fragHouse}
          type={fragType}
          secondary={comp.secondaryFrag ?? undefined}
        />
      </div>

      <div style={{ minWidth: 0, textAlign: 'left' }}>
        {meta && (
          <div
            className="font-sans uppercase mb-1"
            style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy)', fontWeight: 'var(--font-weight-normal)' }}
          >
            {meta}
          </div>
        )}
        {comp.notes && (
          <div
            className="font-serif italic"
            style={{ fontSize: 'var(--text-note)', color: 'var(--color-meta-text)', lineHeight: 'var(--leading-relaxed)' }}
          >
            {comp.notes}
          </div>
        )}
      </div>

      <div
        className="font-sans uppercase"
        style={{ textAlign: 'right', whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy)' }}
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
  const [relationTab, setRelationTab] = useState<Relation | 'ALL'>('ALL');
  const [sort, setSort] = useState('date-desc');
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
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

  useEffect(() => { setPage(1); }, [relationTab, sort, search, perPage]);

  const pageSize = perPage === 0 ? filtered.length : perPage;
  const totalPages = filtered.length === 0 ? 1 : perPage === 0 ? 1 : Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(
    () => perPage === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, perPage, pageSize],
  );


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
      <Topbar title="Compliments" actions={<FragSearch />} />

      <PageContent>
        {/* Page header row */}
        <div className="flex items-center justify-end mb-8">
          <Button variant="primary" onClick={() => setLogOpen(true)}>
            Log Compliment
          </Button>
        </div>

        {/* Filter bar — row 1: relation tabs + per-page */}
        <div className="flex items-start justify-between gap-4 flex-wrap max-sm:flex-col" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="flex flex-wrap gap-2">
            {RELATION_TABS.map((tab) => (
              <TabPill
                key={tab.value}
                label={tab.label}
                count={tabCounts[tab.value] ?? 0}
                active={relationTab === tab.value}
                onClick={() => { setRelationTab(tab.value); }}
              />
            ))}
          </div>
          <div style={{ flexShrink: 0 }}>
            <PerPageControl value={perPage} onChange={(v) => { setPerPage(v); setPage(1); }} />
          </div>
        </div>

        {/* Filter bar — row 2: sort */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Select
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            size="auto"
          />
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
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-1)',
                }}
              />
            ))}
          </div>
        ) : myComps.length === 0 ? (
          <EmptyCompliments onAdd={() => setLogOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="font-sans" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)' }}>
              No compliments match this filter.
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr max-content', columnGap: 'var(--space-10)' }}>
              {paginated.map((comp) => {
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
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          </>
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
