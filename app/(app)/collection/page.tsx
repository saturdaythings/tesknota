"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StarRating } from '@/components/ui/StarRating';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { FragSearch } from '@/components/ui/frag-search';
import { AddFragranceModal } from '@/components/collection/add-fragrance-modal';
import { FragranceDetailModal } from '@/components/collection/fragrance-detail-modal';
import { CollectionFilters } from '@/components/collection/collection-filters';
import { CollectionList, type CollectionColumnDef, type CollectionRowContext } from '@/components/collection/collection-list';
import { FragForm } from '@/components/ui/frag-form';
import { useUser } from '@/lib/user-context';
import { useData } from '@/lib/data-context';
import { useToast } from '@/components/ui/toast';
import { getAccords, shortFragType, MONTHS } from '@/lib/frag-utils';
import { STATUS_LABELS } from '@/types';
import { applySort, addedStr, statusVariant, type SortKey } from '@/lib/collection-utils';
import { FlaskConical } from '@/components/ui/Icons';
import type { UserFragrance } from '@/types';

// Column definitions — add an entry here to add a column to the table
const COLUMNS: CollectionColumnDef[] = [
  {
    id: 'fragrance',
    label: 'Fragrance',
    width: 'minmax(240px,1fr)',
    render: (frag) => {
      const concLabel = shortFragType(frag.type ?? null);
      return (
        <div style={{ padding: 'var(--space-2) 0' }}>
          <div className="flex items-center flex-wrap" style={{ gap: 'var(--space-2)' }}>
            <span
              className="font-serif italic"
              style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-normal)', color: 'var(--color-navy)' }}
            >
              {frag.name}
            </span>
            {concLabel && (
              <span
                className="font-sans uppercase"
                style={{
                  border: '1px solid var(--color-meta-text)',
                  color: 'var(--color-meta-text)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {concLabel}
              </span>
            )}
            {frag.isDupe && (
              <span
                className="font-sans uppercase"
                style={{
                  background: 'var(--color-sand-light)',
                  color: 'var(--color-navy)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                Dupe
              </span>
            )}
          </div>
          <div
            className="font-sans uppercase"
            style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-sm)', color: 'var(--color-meta-text)', marginTop: 'var(--space-half)' }}
          >
            {frag.house}
          </div>
        </div>
      );
    },
  },
  {
    id: 'size',
    label: 'Size',
    width: 'max-content',
    render: (frag) => (
      <span className="font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)' }}>
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
    label: 'Added',
    width: 'max-content',
    render: (frag) => (
      <span className="font-sans" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy)', whiteSpace: 'nowrap' }}>
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
      const visible = accords.slice(0, 4);
      const extra = accords.length > 4 ? accords.length - 4 : 0;
      return (
        <div className="flex flex-wrap" style={{ gap: '3px' }}>
          {visible.map((a) => (
            <span
              key={a}
              className="font-sans"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 7px',
                borderRadius: '100px',
                background: 'var(--color-sand-light)',
                color: 'var(--color-navy)',
                fontSize: 'var(--text-xs)',
                whiteSpace: 'nowrap',
              }}
            >
              {a}
            </span>
          ))}
          {extra > 0 && (
            <span
              className="font-sans"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 7px',
                borderRadius: '100px',
                background: 'var(--color-sand-light)',
                color: 'var(--color-meta-text)',
                fontSize: 'var(--text-xs)',
              }}
            >
              +{extra}
            </span>
          )}
        </div>
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
        <span
          className="font-sans"
          style={{ fontSize: 'var(--text-sm)', color: count > 0 ? 'var(--color-navy)' : 'var(--color-meta-text)' }}
        >
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
      <Badge variant={statusVariant(frag.status)}>
        {STATUS_LABELS[frag.status]}
      </Badge>
    ),
  },
];

function CollectionInner() {
  const { user } = useUser();
  const { fragrances, compliments, communityFrags, isLoaded, removeFrag, editFrag } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const sort = (searchParams.get('sort') as SortKey) || 'name_asc';

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accordFilter, setAccordFilter] = useState<string[]>([]);
  const [ratingFilter, setRatingFilter] = useState('any');
  const [statusFilter, setStatusFilter] = useState('all');
  const [houseFilter, setHouseFilter] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFrag, setEditingFrag] = useState<UserFragrance | null>(null);
  const [detailFrag, setDetailFrag] = useState<UserFragrance | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const setSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'name_asc') params.set('sort', value);
      else params.delete('sort');
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

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
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.house.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter((f) => f.status === statusFilter);
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
    return applySort(list, sort, compMap);
  }, [myFrags, search, sort, statusFilter, ratingFilter, accordFilter, houseFilter, compMap, communityFrags]);

  const filtersActive =
    search.trim() !== '' ||
    sort !== 'name_asc' ||
    accordFilter.length > 0 ||
    ratingFilter !== 'any' ||
    statusFilter !== 'all' ||
    houseFilter.length > 0;

  useEffect(() => { setPage(1); }, [search, sort, statusFilter, ratingFilter, accordFilter, houseFilter, perPage]);

  const pageSize = perPage === 0 ? filtered.length : perPage;
  const totalPages = filtered.length === 0 ? 1 : perPage === 0 ? 1 : Math.ceil(filtered.length / pageSize);
  const paginated = perPage === 0 ? filtered : filtered.slice((page - 1) * pageSize, page * pageSize);

  if (!user) return null;

  function clearFilters() {
    setSearch('');
    setAccordFilter([]);
    setRatingFilter('any');
    setStatusFilter('all');
    setHouseFilter([]);
    router.push(window.location.pathname);
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

  return (
    <>
      <FragranceDetailModal
        frag={detailFrag}
        open={!!detailFrag}
        onClose={() => setDetailFrag(null)}
        communityFrags={communityFrags}
        compliments={myComps}
        userId={user.id}
        onEdit={(frag) => { setDetailFrag(null); setEditingFrag(frag); setFormOpen(true); }}
        onDelete={handleDelete}
      />
      <AddFragranceModal open={addOpen} onClose={() => setAddOpen(false)} />
      <FragForm open={formOpen} onClose={() => { setFormOpen(false); setEditingFrag(null); }} editing={editingFrag} />

      <Topbar title="My Collection" actions={<FragSearch />} />

      <PageContent>
        <div className="flex items-center justify-end mb-8">
          <Button variant="primary" onClick={() => setAddOpen(true)}>Add to Collection</Button>
        </div>

        <CollectionFilters
          search={search} onSearch={setSearch}
          sort={sort} onSort={setSort}
          filtersOpen={filtersOpen} onFiltersOpen={setFiltersOpen}
          accordFilter={accordFilter} onAccordFilter={setAccordFilter}
          ratingFilter={ratingFilter} onRatingFilter={setRatingFilter}
          statusFilter={statusFilter} onStatusFilter={setStatusFilter}
          houseFilter={houseFilter} onHouseFilter={setHouseFilter}
          accordOptions={accordOptions} houseOptions={houseOptions}
          filtersActive={filtersActive} onClearFilters={clearFilters}
          perPage={perPage} onPerPage={(v) => { setPerPage(v); setPage(1); }}
        />

        {isLoaded && (
          <div
            className="font-sans uppercase"
            style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', letterSpacing: 'var(--tracking-md)', color: 'var(--color-meta-text)', marginBottom: 'var(--space-4)' }}
          >
            {filtered.length} {filtered.length === 1 ? 'Fragrance' : 'Fragrances'}
          </div>
        )}

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
            height: '64px',
            borderBottom: '1px solid var(--color-sand-light)',
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
