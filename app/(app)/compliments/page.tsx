"use client";

import { useState, useMemo, useEffect, Suspense } from 'react';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { TabPill } from '@/components/ui/tab-pill';
import { LogComplimentModal } from '@/components/compliments/log-compliment-modal';
import { ComplimentsList, type ComplimentColumnDef, type FragInfo } from '@/components/compliments/compliments-list';
import { EmptyCompliments } from '@/components/compliments/empty-compliments';
import { PageHeader } from '@/components/ui/page-header';
import { PageContent } from '@/components/layout/PageContent';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import { getAccords } from '@/lib/frag-utils';
import { compSortNum, formatDate, buildMeta, RELATION_TABS, SORT_FIELD_OPTIONS } from '@/lib/compliment-utils';
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
            className="font-sans uppercase mb-1 max-sm:text-sm"
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
        className="font-sans uppercase max-sm:text-sm"
        style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-navy)' }}
      >
        {formatDate(comp)}
      </div>
    ),
  },
];

function ComplimentsInner() {
  const { user } = useUser();
  const { compliments, fragrances, communityFrags, isLoaded } = useData();

  const [logOpen, setLogOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<UserCompliment | null>(null);
  const [search, setSearch] = useState('');
  const [relationTab, setRelationTab] = useState<Relation | 'ALL'>('ALL');
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [accordFilter, setAccordFilter] = useState('any');
  const [houseFilter, setHouseFilter] = useState('any');

  const myComps = useMemo(
    () => (user ? compliments.filter((c) => c.userId === user.id) : []),
    [compliments, user],
  );

  const fragById = useMemo(() => {
    if (!user) return new Map();
    const myFrags = fragrances.filter((f) => f.userId === user.id);
    return new Map(myFrags.map((f) => [f.fragranceId || f.id, f]));
  }, [fragrances, user]);

  const accordOptions = useMemo(() => {
    const s = new Set<string>();
    myComps.forEach((c) => {
      const f = fragById.get(c.primaryFragId ?? '');
      if (f) getAccords(f, communityFrags).forEach((a) => s.add(a));
    });
    return [{ value: 'any', label: 'Any accord' }, ...Array.from(s).sort().map((a) => ({ value: a, label: a }))];
  }, [myComps, fragById, communityFrags]);

  const houseOptions = useMemo(() => {
    const s = new Set<string>();
    myComps.forEach((c) => {
      const f = fragById.get(c.primaryFragId ?? '');
      if (f?.house) s.add(f.house);
    });
    return [{ value: 'any', label: 'Any house' }, ...Array.from(s).sort().map((h) => ({ value: h, label: h }))];
  }, [myComps, fragById]);

  const tabCounts = useMemo(() => {
    const map: Record<string, number> = { ALL: myComps.length };
    for (const c of myComps) map[c.relation] = (map[c.relation] ?? 0) + 1;
    return map;
  }, [myComps]);

  const filtered = useMemo(() => {
    let base = relationTab === 'ALL' ? myComps : myComps.filter((c) => c.relation === relationTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      base = base.filter((c) =>
        (c.primaryFrag ?? '').toLowerCase().includes(q) ||
        (c.notes ?? '').toLowerCase().includes(q),
      );
    }
    if (accordFilter !== 'any') {
      base = base.filter((c) => {
        const f = fragById.get(c.primaryFragId ?? '');
        return f ? getAccords(f, communityFrags).includes(accordFilter) : false;
      });
    }
    if (houseFilter !== 'any') {
      base = base.filter((c) => {
        const f = fragById.get(c.primaryFragId ?? '');
        return f ? f.house === houseFilter : false;
      });
    }
    return [...base].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = compSortNum(a) - compSortNum(b);
      else if (sortField === 'fragrance') cmp = (a.primaryFrag ?? '').localeCompare(b.primaryFrag ?? '');
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [myComps, relationTab, sortField, sortDir, search, accordFilter, houseFilter, fragById, communityFrags]);

  const filtersActive = accordFilter !== 'any' || houseFilter !== 'any';

  function clearFilters() {
    setAccordFilter('any');
    setHouseFilter('any');
  }

  useEffect(() => { setPage(1); }, [relationTab, sortField, sortDir, perPage, search, accordFilter, houseFilter]);

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
      <PageContent>
        <PageHeader
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Search your compliments..."
          addLabel="Log Compliment"
          onAdd={() => setLogOpen(true)}
          sortFields={SORT_FIELD_OPTIONS}
          sortField={sortField}
          onSortField={setSortField}
          sortDir={sortDir}
          onSortDir={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          filters={[
            { value: accordFilter, onChange: setAccordFilter, options: accordOptions },
            { value: houseFilter, onChange: setHouseFilter, options: houseOptions },
          ]}
          filtersActive={filtersActive}
          onClearFilters={clearFilters}
          perPage={perPage}
          onPerPage={(v) => { setPerPage(v); setPage(1); }}
          count={isLoaded ? filtered.length : undefined}
          countLabel="Compliment"
          isLoaded={isLoaded}
        />

        <div className="flex flex-wrap" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
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
