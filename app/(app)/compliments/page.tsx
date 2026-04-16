"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { ComplimentFilters } from '@/components/compliments/compliment-filters';
import { ComplimentsList, type ComplimentColumnDef, type FragInfo } from '@/components/compliments/compliments-list';
import { EmptyCompliments } from '@/components/compliments/empty-compliments';
import { FragSearch } from '@/components/ui/frag-search';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import { compSortNum, formatDate, buildMeta } from '@/lib/compliment-utils';
import type { UserCompliment, Relation } from '@/types';

// Column definitions — add an entry here to add a column to the table
const COLUMNS: ComplimentColumnDef[] = [
  {
    id: 'fragrance',
    width: 'max-content',
    render: (comp, frag) => (
      <FragranceCell
        name={frag.name}
        house={frag.house}
        type={frag.type}
        secondary={comp.secondaryFrag ?? undefined}
      />
    ),
  },
  {
    id: 'details',
    width: '1fr',
    render: (comp) => (
      <>
        {buildMeta(comp) && (
          <div
            className="font-sans uppercase mb-1"
            style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy)', fontWeight: 'var(--font-weight-normal)' }}
          >
            {buildMeta(comp)}
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
      </>
    ),
  },
  {
    id: 'date',
    width: 'max-content',
    align: 'right',
    render: (comp) => (
      <div
        className="font-sans uppercase"
        style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy)' }}
      >
        {formatDate(comp)}
      </div>
    ),
  },
];

function ComplimentsInner() {
  const { user } = useUser();
  const { compliments, fragrances, isLoaded } = useData();

  const [logOpen, setLogOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<UserCompliment | null>(null);
  const [relationTab, setRelationTab] = useState<Relation | 'ALL'>('ALL');
  const [sort, setSort] = useState('date-desc');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const myComps = useMemo(
    () => (user ? compliments.filter((c) => c.userId === user.id) : []),
    [compliments, user],
  );

  const fragById = useMemo(() => {
    if (!user) return new Map();
    const myFrags = fragrances.filter((f) => f.userId === user.id);
    return new Map(myFrags.map((f) => [f.fragranceId || f.id, f]));
  }, [fragrances, user]);

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: myComps.length };
    for (const c of myComps) map[c.relation] = (map[c.relation] ?? 0) + 1;
    return map;
  }, [myComps]);

  const filtered = useMemo(() => {
    const base = relationTab === 'ALL' ? myComps : myComps.filter((c) => c.relation === relationTab);
    if (sort === 'date-desc') return [...base].sort((a, b) => compSortNum(b) - compSortNum(a));
    if (sort === 'date-asc') return [...base].sort((a, b) => compSortNum(a) - compSortNum(b));
    if (sort === 'frag-az') return [...base].sort((a, b) => (a.primaryFrag ?? '').localeCompare(b.primaryFrag ?? ''));
    return base;
  }, [myComps, relationTab, sort]);

  useEffect(() => { setPage(1); }, [relationTab, sort, perPage]);

  if (!user) return null;

  const pageSize = perPage === 0 ? filtered.length : perPage;
  const totalPages = filtered.length === 0 ? 1 : perPage === 0 ? 1 : Math.ceil(filtered.length / pageSize);
  const paginated = perPage === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize);

  function getFragInfo(comp: UserCompliment): FragInfo {
    const f = fragById.get(comp.primaryFragId ?? '') ?? null;
    return { name: f?.name ?? comp.primaryFrag ?? '-', house: f?.house ?? '', type: f?.type ?? null };
  }

  return (
    <>
      <LogComplimentModal open={logOpen} onClose={() => setLogOpen(false)} />
      <LogComplimentModal open={!!editingComp} onClose={() => setEditingComp(null)} editing={editingComp} />
      <Topbar title="Compliments" actions={<FragSearch />} />

      <PageContent>
        <div className="flex items-center justify-end mb-8">
          <Button variant="primary" onClick={() => setLogOpen(true)}>Log Compliment</Button>
        </div>

        <ComplimentFilters
          relationTab={relationTab}
          onRelationTab={setRelationTab}
          tabCounts={tabCounts}
          sort={sort}
          onSort={setSort}
          perPage={perPage}
          onPerPage={(v) => { setPerPage(v); setPage(1); }}
        />

        {!isLoaded ? (
          <ComplimentsSkeleton />
        ) : myComps.length === 0 ? (
          <EmptyCompliments onAdd={() => setLogOpen(true)} />
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center font-sans" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)' }}>
            No compliments match this filter.
          </div>
        ) : (
          <ComplimentsList
            items={paginated}
            columns={COLUMNS}
            getFragInfo={getFragInfo}
            onEdit={setEditingComp}
            page={page}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}
      </PageContent>
    </>
  );
}

/* component-internal: compliment row min-height */
const SKELETON_ROW_HEIGHT = '80px';

function ComplimentsSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: SKELETON_ROW_HEIGHT,
            borderBottom: '1px solid var(--color-row-divider)',
            background: 'var(--color-row-hover)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-1)',
          }}
        />
      ))}
    </div>
  );
}

export default function ComplimentsPage() {
  return (
    <Suspense>
      <ComplimentsInner />
    </Suspense>
  );
}
