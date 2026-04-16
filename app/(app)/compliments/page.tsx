"use client";

import { useState, useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { Header } from '@/components/layout/Header';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import type { UserCompliment, Relation, FragranceType } from '@/types';
import { MessageCircle } from '@/components/ui/Icons';

// ── Constants ──────────────────────────────────────────────

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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

function TabPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-sans uppercase transition-colors duration-100 flex-shrink-0 cursor-pointer"
      style={{
        fontSize: '12px',
        fontWeight: 400,
        letterSpacing: '0.08em',
        padding: '6px 12px',
        borderRadius: '2px',
        background: active ? 'var(--color-navy)' : 'transparent',
        color: active ? 'var(--color-cream)' : 'var(--color-navy)',
        border: active ? '1px solid var(--color-navy)' : '1px solid rgba(30,45,69,0.65)',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="font-sans"
          style={{
            fontSize: '11px',
            opacity: 0.8,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

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
        padding: '16px 0',
        borderBottom: '1px solid var(--color-cream-dark)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,224,208,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Column 1: Fragrance */}
      <div className="flex-1 min-w-0">
        {/* Line 1: frag name + badge + layered */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className="font-serif italic"
            style={{ fontSize: '20px', color: 'var(--color-navy)', lineHeight: 1.2 }}
          >
            {fragName}
          </span>
          {fragType && (
            <Badge variant="neutral" className="text-[11px] py-[2px]">
              {fragType}
            </Badge>
          )}
          {comp.secondaryFrag && (
            <span
              className="font-serif italic"
              style={{ fontSize: '15px', color: 'var(--color-navy)' }}
            >
              + {comp.secondaryFrag}
            </span>
          )}
        </div>

        {/* Line 2: house */}
        {fragHouse && (
          <div
            className="font-sans uppercase tracking-[0.1em]"
            style={{ fontSize: '12px', color: 'var(--color-navy)' }}
          >
            {fragHouse}
          </div>
        )}
      </div>

      {/* Column 2: Meta + Notes */}
      <div className="flex-1 min-w-0">
        {/* Line 1: relation · gender · location */}
        {meta && (
          <div
            className="font-sans mb-1"
            style={{ fontSize: '12px', color: 'rgba(30,45,69,0.65)' }}
          >
            {meta}
          </div>
        )}

        {/* Line 2: notes */}
        {comp.notes && (
          <div
            className="font-serif italic"
            style={{ fontSize: '16px', color: 'rgba(30,45,69,0.7)', lineHeight: 1.6 }}
          >
            {comp.notes}
          </div>
        )}
      </div>

      {/* Column 3: Date */}
      <div
        className="font-sans flex-shrink-0 text-right"
        style={{ fontSize: '14px', color: 'var(--color-navy)', minWidth: '72px' }}
      >
        {date}
      </div>
    </div>
  );
}

function EmptyCompliments({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <MessageCircle size={40} style={{ color: 'var(--color-navy)', marginBottom: '16px' }} />
      <div
        className="font-serif italic mb-2"
        style={{ fontSize: '22px', color: 'var(--color-navy)' }}
      >
        No compliments yet
      </div>
      <div
        className="font-sans mb-6"
        style={{ fontSize: '14px', color: 'var(--color-navy)', maxWidth: '280px' }}
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

  if (!user) return null;

  const myComps = compliments.filter((c) => c.userId === user.id);
  const myFrags = fragrances.filter((f) => f.userId === user.id);

  // Build lookup maps
  const fragById = new Map(myFrags.map((f) => [f.fragranceId || f.id, f]));

  function getFragInfo(comp: UserCompliment) {
    const f = fragById.get(comp.primaryFragId ?? '') ?? null;
    return {
      name: f?.name ?? comp.primaryFrag ?? '-',
      house: f?.house ?? '',
      type: f?.type ?? null,
    };
  }

  // Tab counts
  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: myComps.length };
    for (const c of myComps) {
      map[c.relation] = (map[c.relation] ?? 0) + 1;
    }
    return map;
  }, [myComps]);

  // Filtered + sorted
  const displayed = useMemo(() => {
    let result = relationTab === 'ALL' ? myComps : myComps.filter((c) => c.relation === relationTab);
    if (sort === 'date-desc') result = [...result].sort((a, b) => compSortNum(b) - compSortNum(a));
    else if (sort === 'date-asc') result = [...result].sort((a, b) => compSortNum(a) - compSortNum(b));
    else if (sort === 'frag-az') result = [...result].sort((a, b) => (a.primaryFrag ?? '').localeCompare(b.primaryFrag ?? ''));
    return result;
  }, [myComps, relationTab, sort]);

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

      <Header pageTitle="Compliments" />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--color-cream)', padding: '32px 16px 40px' }}>
        <div
          className="mx-auto"
          style={{ maxWidth: '1200px' }}
        >
          {/* Page header row */}
          <div className="flex items-center justify-end mb-8">
            <Button variant="primary" onClick={() => setLogOpen(true)}>
              Log Compliment
            </Button>
          </div>

          {/* Filter bar */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6 max-sm:flex-col">
            {/* Tab pills */}
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

            {/* Sort */}
            <div className="max-sm:w-full max-sm:mt-3" style={{ width: '160px', flexShrink: 0, marginLeft: 'auto' }}>
              <Select
                options={SORT_OPTIONS}
                value={sort}
                onChange={setSort}
                className="text-[12px]"
              />
            </div>
          </div>

          {/* List */}
          {!isLoaded ? (
            /* Skeleton */
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: '80px',
                    borderBottom: '1px solid var(--color-cream-dark)',
                    background: 'rgba(237,232,223,0.3)',
                    borderRadius: '3px',
                    marginBottom: '2px',
                  }}
                />
              ))}
            </div>
          ) : myComps.length === 0 ? (
            <EmptyCompliments onAdd={() => setLogOpen(true)} />
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center">
              <div className="font-sans" style={{ fontSize: '14px', color: 'var(--color-navy)' }}>
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
        </div>
      </main>
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
