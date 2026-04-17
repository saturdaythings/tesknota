"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StarRating } from '@/components/ui/StarRating';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { FragSearch } from '@/components/ui/frag-search';
import { PageFilterBar } from '@/components/ui/page-filter-bar';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { AddFragranceModal } from '@/components/collection/add-fragrance-modal';
import { FragranceDetailModal } from '@/components/collection/fragrance-detail-modal';
import { CollectionList, type CollectionColumnDef, type CollectionRowContext } from '@/components/collection/collection-list';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import { useToast } from '@/components/ui/toast';
import { getAccords } from '@/lib/frag-utils';
import {
  applySort, addedStr, parseSortKey,
  SORT_FIELD_OPTIONS, RATING_FILTER_OPTIONS, STATUS_FILTER_OPTIONS,
  type SortField, type SortDir,
} from '@/lib/collection-utils';
import { FlaskConical } from '@/components/ui/Icons';
import { STATUS_LABELS, type UserFragrance } from '@/types';

const cellStyle = {
  fontSize: 'var(--text-xs)',
  letterSpacing: 'var(--tracking-md)',
  color: 'var(--color-navy)',
} as const;

const STATUS_OPTIONS = STATUS_FILTER_OPTIONS.filter((o) => o.value !== 'all');

// Column definitions — add an entry here to add a column to the table
const COLUMNS: CollectionColumnDef[] = [
  {
    id: 'fragrance',
    label: 'Fragrance',
    width: 'minmax(240px,1fr)',
    render: (frag) => (
      <div className="flex items-start gap-2">
        <FragranceCell name={frag.name} house={frag.house} type={frag.type ?? null} />
        {frag.isDupe && (
          <span
            className="font-sans uppercase flex-shrink-0"
            style={{
              background: 'var(--color-sand-light)',
              color: 'var(--color-navy)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-medium)',
              padding: 'var(--space-half) 6px', /* component-internal: 6px — no token between --space-1 (4px) and --space-2 (8px) */
              borderRadius: 'var(--radius-sm)',
              marginTop: '3px', /* component-internal: 3px — no spacing token for 3px */
            }}
          >
            Dupe
          </span>
        )}
      </div>
    ),
  },
  {
    id: 'size',
    label: 'Size',
    width: 'max-content',
    render: (frag) => (
      <span className="font-sans uppercase" style={cellStyle}>
        {frag.sizes?.length ? frag.sizes[0] : '—'}
      </span>
    ),
  },
  {
    id: 'rating',
    label: 'Rating',
    width: 'max-content',
    render: (frag, ctx) => (
      <div onClick={(e) => e.stopPropagation()}>
        <StarRating
          value={frag.personalRating ?? 0}
          onChange={(r) => ctx.onRatingUpdate(frag, r)}
          size={15}
        />
      </div>
    ),
  },
  {
    id: 'added',
    label: 'Date Added',
    width: 'max-content',
    render: (frag) => (
      <span className="font-sans uppercase" style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
        {addedStr(frag.createdAt) || '—'}
      </span>
    ),
  },
  {
    id: 'accords',
    label: 'Accords',
    width: '200px',
    render: (frag, ctx) => {
      const accords = getAccords(frag, ctx.communityFrags);
      return (
        <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', lineHeight: 'var(--leading-relaxed)' }}>
          {accords.length ? accords.join(', ') : '—'}
        </span>
      );
    },
  },
  {
    id: 'compliments',
    label: 'Compliments',
    width: 'max-content',
    render: (frag, ctx) => {
      const count = ctx.compMap[frag.fragranceId ?? frag.id] ?? 0;
      return (
        <span className="font-sans uppercase" style={{ ...cellStyle, color: count > 0 ? 'var(--color-navy)' : 'var(--color-meta-text)' }}>
          {count > 0 ? count : '—'}
        </span>
      );
    },
  },
  {
    id: 'status',
    label: 'Status',
    width: 'max-content',
    render: (frag) => (
      <span className="font-sans uppercase" style={cellStyle}>
        {STATUS_LABELS[frag.status]}
      </span>
    ),
  },
];

function CollectionInner() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag, editFrag } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawSort = searchParams.get('sort');
  const { field: sortField, dir: sortDir } = parseSortKey(rawSort);
  const filterParam = searchParams.get('filter');

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accordFilter, setAccordFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState('any');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [houseFilter, setHouseFilter] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const pushSort = useCallback(
    (field: SortField, dir: SortDir) => {
      const key = `${field}_${dir}`;
      const params = new URLSearchParams(searchParams.toString());
      if (key !== 'fragrance_asc') params.set('sort', key);
      else params.delete('sort');
      const qs = params.toString();
      router.replace(pathname + (qs ? '?' + qs : ''), { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const handleSortField = useCallback((v: SortField) => pushSort(v, sortDir), [pushSort, sortDir]);
  const handleToggleSortDir = useCallback(() => pushSort(sortField, sortDir === 'asc' ? 'desc' : 'asc'), [pushSort, sortField, sortDir]);

  const myFrags = useMemo(
    () => (user ? fragrances.filter((f) => f.userId === user.id) : []),
    [fragrances, user],
  );

  const myComps = useMemo(
    () => (user ? compliments.filter((c) => c.userId === user.id) : []),
    [compliments, user],
  );

  const compMap = useMemo(() => {
    const map: Record<string, number> = {};
    myComps.forEach((c) => {
      if (c.primaryFragId) map[c.primaryFragId] = (map[c.primaryFragId] ?? 0) + 1;
    });
    return map;
  }, [myComps]);

  const accordOptions = useMemo(() => {
    const s = new Set<string>();
    myFrags.forEach((f) => getAccords(f, communityFrags).forEach((a) => s.add(a)));
    return Array.from(s).sort().map((a) => ({ value: a, label: a }));
  }, [myFrags, communityFrags]);

  const houseOptions = useMemo(() => {
    const s = new Set<string>();
    myFrags.forEach((f) => { if (f.house) s.add(f.house); });
    return Array.from(s).sort().map((h) => ({ value: h, label: h }));
  }, [myFrags]);

  const filtered = useMemo(() => {
    let list = myFrags;
    if (filterParam === 'missing') {
      list = list.filter((f) => !f.personalRating || !f.house || !f.type);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (statusFilter.length > 0) list = list.filter((f) => statusFilter.includes(f.status));
    if (ratingFilter !== 'any') {
      list = list.filter((f) => {
        const r = f.personalRating ?? 0;
        if (ratingFilter === '5') return r === 5;
        if (ratingFilter === '4plus') return r >= 4;
        if (ratingFilter === '3plus') return r >= 3;
        if (ratingFilter === '1to2') return r >= 1 && r <= 2;
        if (ratingFilter === 'unrated') return !r;
        return true;
      });
    }
    if (accordFilter.length > 0) {
      list = list.filter((f) => accordFilter.some((a) => getAccords(f, communityFrags).includes(a)));
    }
    if (houseFilter.length > 0) list = list.filter((f) => houseFilter.includes(f.house));
    return applySort(list, sortField, sortDir, compMap);
  }, [myFrags, search, filterParam, sortField, sortDir, statusFilter, ratingFilter, accordFilter, houseFilter, compMap, communityFrags]);

  const filtersActive =
    accordFilter.length > 0 ||
    ratingFilter !== 'any' ||
    statusFilter.length > 0 ||
    houseFilter.length > 0;

  useEffect(() => { setPage(1); }, [search, sortField, sortDir, statusFilter, ratingFilter, accordFilter, houseFilter, perPage]);

  const pageSize = perPage === 0 ? filtered.length : perPage;
  const totalPages = filtered.length === 0 ? 1 : perPage === 0 ? 1 : Math.ceil(filtered.length / pageSize);
  const paginated = perPage === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize);

  if (!user) return null;

  function clearFilters() {
    setAccordFilter([]);
    setRatingFilter('any');
    setStatusFilter([]);
    setHouseFilter([]);
  }

  async function handleDelete(frag: UserFragrance) {
    await removeFrag(frag.id);
    setDetailFrag(null);
    toast('Fragrance removed.');
  }

  async function handleRatingUpdate(frag: UserFragrance, rating: number) {
    await editFrag({ ...frag, personalRating: rating });
  }

  const rowCtx: CollectionRowContext = { compMap, communityFrags, onRatingUpdate: handleRatingUpdate };

  const filterPanel = (
    <>
      <div style={{ width: '160px' }}>
        <MultiSelect options={accordOptions} value={accordFilter} onChange={setAccordFilter} placeholder="Accords" />
      </div>
      <div style={{ width: '160px' }}>
        <Select options={RATING_FILTER_OPTIONS} value={ratingFilter} onChange={setRatingFilter} placeholder="Rating" />
      </div>
      <div style={{ width: '180px' }}>
        <MultiSelect options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} placeholder="Status" />
      </div>
      <div style={{ width: '160px' }}>
        <MultiSelect options={houseOptions} value={houseFilter} onChange={setHouseFilter} placeholder="Houses" />
      </div>
    </>
  );

  return (
    <>
      <FragranceDetailModal
        frag={detailFrag}
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        compliments={myComps}
        userId={user.id}
        onDelete={handleDelete}
      />
      <AddFragranceModal open={addOpen} onClose={() => setAddOpen(false)} />

      <Topbar title="My Collection" actions={<FragSearch />} />

      <PageContent>
        <PageFilterBar
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search your collection..."
          action={<Button variant="primary" onClick={() => setAddOpen(true)}>Add to Collection</Button>}
          sortField={sortField}
          sortDir={sortDir}
          sortOptions={SORT_FIELD_OPTIONS}
          onSortField={(v) => handleSortField(v as SortField)}
          onToggleSortDir={handleToggleSortDir}
          filtersOpen={filtersOpen}
          onFiltersOpen={setFiltersOpen}
          filtersActive={filtersActive}
          onClearFilters={clearFilters}
          filterPanel={filterPanel}
          perPage={perPage}
          onPerPage={(v) => { setPerPage(v); setPage(1); }}
          count={isLoaded ? filtered.length : undefined}
          countLabel="Fragrance"
          isLoaded={isLoaded}
        />

        {!isLoaded ? (
          <CollectionSkeleton />
        ) : myFrags.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={48} />}
            title="Your collection is empty"
            description="Start tracking your fragrances."
            action={<Button variant="primary" onClick={() => setAddOpen(true)}>Add Fragrance</Button>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FlaskConical size={48} />}
            title="No matches"
            description="Try adjusting your filters."
            action={<Button variant="ghost" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <CollectionList
            items={paginated}
            columns={COLUMNS}
            ctx={rowCtx}
            onOpen={setDetailFrag}
            page={page}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}
      </PageContent>
    </>
  );
}

function CollectionSkeleton() {
  return (
    <div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 'var(--space-16)',
            borderBottom: '1px solid var(--color-row-divider)',
            background: 'var(--color-row-hover)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-1)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--space-4)',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <Skeleton className="h-4 w-40 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense>
      <CollectionInner />
    </Suspense>
  );
}
