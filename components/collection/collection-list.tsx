"use client";

import type { UserFragrance, CommunityFrag } from '@/types';
import { FragranceCard } from '@/components/collection/fragrance-card';
import { Pagination } from '@/components/ui/pagination';
import { getAccords } from '@/lib/frag-utils';
import { addedStr } from '@/lib/collection-utils';

export interface CollectionRowContext {
  compMap: Record<string, number>;
  communityFrags: CommunityFrag[];
  onRatingUpdate: (frag: UserFragrance, rating: number) => void;
}

export interface CollectionColumnDef {
  id: string;
  label: string;
  width: string;
  align?: 'left' | 'right';
  render: (frag: UserFragrance, ctx: CollectionRowContext) => React.ReactNode;
}

interface CollectionListProps {
  items: UserFragrance[];
  columns: CollectionColumnDef[];
  ctx: CollectionRowContext;
  onOpen: (frag: UserFragrance) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function CollectionList({ items, columns, ctx, onOpen, page, totalPages, onPage }: CollectionListProps) {
  const gridTemplateColumns = columns.map((c) => c.width).join(' ');

  return (
    <>
      <div
        className="hidden md:grid"
        style={{ gridTemplateColumns, columnGap: 'var(--space-10)' }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'subgrid',
            gridColumn: '1 / -1',
            background: 'var(--color-cream-dark)',
            borderBottom: '1px solid var(--color-row-divider)',
            height: 'var(--space-10)',
            alignItems: 'center',
          }}
        >
          {columns.map((col) => (
            <div
              key={col.id}
              className="font-sans uppercase"
              style={{
                padding: '0 var(--space-4)',
                fontSize: 'var(--text-xxs)',
                fontWeight: 'var(--font-weight-medium)',
                letterSpacing: 'var(--tracking-md)',
                color: 'var(--color-navy)',
                textAlign: col.align ?? 'left',
              }}
            >
              {col.label}
            </div>
          ))}
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
        minHeight: 'var(--space-16)',
        borderBottom: '1px solid var(--color-row-divider)',
        background: 'transparent',
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
