"use client";

import type { UserFragrance, CommunityFrag } from '@/types';
import { FragranceCard } from '@/components/collection/fragrance-card';
import { Pagination } from '@/components/ui/pagination';
import { getAccords } from '@/lib/frag-utils';
import { addedStr, type SortKey } from '@/lib/collection-utils';

export interface CollectionRowContext {
  compMap: Record<string, number>;
  communityFrags: CommunityFrag[];
  onRatingUpdate: (frag: UserFragrance, rating: number) => void;
}

export interface CollectionColumnDef {
  id: string;
  label: string;
  /** CSS grid track: 'minmax(240px,1fr)', 'max-content', '200px', etc. */
  width: string;
  align?: 'left' | 'right';
  /** Sort keys for this column. When absent, header is not clickable. */
  sortKeyAsc?: SortKey;
  sortKeyDesc?: SortKey;
  render: (frag: UserFragrance, ctx: CollectionRowContext) => React.ReactNode;
}

interface CollectionListProps {
  items: UserFragrance[];
  columns: CollectionColumnDef[];
  ctx: CollectionRowContext;
  onOpen: (frag: UserFragrance) => void;
  sort: string;
  onSort: (key: string) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function CollectionList({
  items, columns, ctx, onOpen, sort, onSort, page, totalPages, onPage,
}: CollectionListProps) {
  const gridTemplateColumns = columns.map((c) => c.width).join(' ');

  function handleHeaderClick(col: CollectionColumnDef) {
    if (!col.sortKeyAsc || !col.sortKeyDesc) return;
    if (sort === col.sortKeyAsc) onSort(col.sortKeyDesc);
    else onSort(col.sortKeyAsc);
  }

  return (
    <>
      {/* Desktop: single grid so header and rows share column sizing */}
      <div className="hidden md:block" style={{ display: 'grid', gridTemplateColumns, columnGap: 'var(--space-6)' }}>

        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridColumn: '1 / -1',
            background: 'var(--color-cream-dark)',
            borderBottom: '1px solid var(--color-sand-light)',
            height: '40px',
            alignItems: 'center',
          }}
        >
          {columns.map((col) => {
            const isActive = sort === col.sortKeyAsc || sort === col.sortKeyDesc;
            const sortable = !!(col.sortKeyAsc && col.sortKeyDesc);
            return (
              <div
                key={col.id}
                onClick={sortable ? () => handleHeaderClick(col) : undefined}
                className="font-sans uppercase flex items-center"
                style={{
                  padding: '0 var(--space-4)',
                  fontSize: 'var(--text-xxs)',
                  fontWeight: 'var(--font-weight-medium)',
                  letterSpacing: 'var(--tracking-md)',
                  color: 'var(--color-navy)',
                  textAlign: col.align ?? 'left',
                  gap: 'var(--space-1)',
                  cursor: sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                {col.label}
                {sortable && (
                  <SortArrow
                    active={isActive}
                    direction={sort === col.sortKeyDesc ? 'desc' : 'asc'}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {items.map((frag) => (
          <CollectionRow
            key={frag.id}
            frag={frag}
            columns={columns}
            ctx={ctx}
            onOpen={() => onOpen(frag)}
          />
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        {items.map((frag) => (
          <FragranceCard
            key={frag.id}
            frag={frag}
            compCount={ctx.compMap[frag.fragranceId ?? frag.id] ?? 0}
            accords={getAccords(frag, ctx.communityFrags)}
            addedDate={addedStr(frag.createdAt) || null}
            onClick={() => onOpen(frag)}
          />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </>
  );
}

function SortArrow({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
        style={{ color: 'var(--color-navy)', opacity: 0.3, flexShrink: 0 }}>
        <path d="M5 1v8M2 4L5 1l3 3M2 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
      style={{ color: 'var(--color-navy)', flexShrink: 0 }}>
      {direction === 'asc'
        ? <path d="M5 8V2M2 5L5 2l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M5 2v6M2 5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  );
}

interface CollectionRowProps {
  frag: UserFragrance;
  columns: CollectionColumnDef[];
  ctx: CollectionRowContext;
  onOpen: () => void;
}

function CollectionRow({ frag, columns, ctx, onOpen }: CollectionRowProps) {
  return (
    <div
      onClick={onOpen}
      className="cursor-pointer transition-colors duration-100"
      style={{
        display: 'grid',
        gridTemplateColumns: 'subgrid',
        gridColumn: '1 / -1',
        alignItems: 'center',
        minHeight: '64px',
        borderBottom: '1px solid var(--color-sand-light)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {columns.map((col) => (
        <div
          key={col.id}
          style={{ padding: '0 var(--space-4)', minWidth: 0, textAlign: col.align ?? 'left' }}
        >
          {col.render(frag, ctx)}
        </div>
      ))}
    </div>
  );
}
