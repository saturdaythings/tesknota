"use client";

import { Button } from '@/components/ui/button';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import type { UserCompliment, FragranceType } from '@/types';
import { Pagination } from '@/components/ui/pagination';

/* component-internal: compliment row min-height */
const ROW_MIN_HEIGHT = '80px';

export interface FragInfo {
  name: string;
  house: string;
  type: FragranceType | null;
}

export interface ComplimentColumnDef {
  id: string;
  /** CSS grid track size: 'max-content', '1fr', etc. */
  width: string;
  align?: 'left' | 'right';
  render: (comp: UserCompliment, frag: FragInfo) => React.ReactNode;
}

interface ComplimentsListProps {
  items: UserCompliment[];
  columns: ComplimentColumnDef[];
  getFragInfo: (comp: UserCompliment) => FragInfo;
  onEdit: (comp: UserCompliment) => void;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function ComplimentsList({
  items, columns, getFragInfo, onEdit, page, totalPages, onPage,
}: ComplimentsListProps) {
  const gridTemplateColumns = columns.map((c) => c.width).join(' ');

  return (
    <>
      {/* Desktop grid */}
      <div className="hidden md:grid" style={{ gridTemplateColumns, columnGap: 'var(--space-10)' }}>
        {items.map((comp) => (
          <ComplimentRow
            key={comp.id}
            comp={comp}
            frag={getFragInfo(comp)}
            columns={columns}
            onEdit={() => onEdit(comp)}
          />
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        {items.map((comp) => (
          <ComplimentMobileCard
            key={comp.id}
            comp={comp}
            frag={getFragInfo(comp)}
            onEdit={() => onEdit(comp)}
          />
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={onPage} />
    </>
  );
}

interface ComplimentRowProps {
  comp: UserCompliment;
  frag: FragInfo;
  columns: ComplimentColumnDef[];
  onEdit: () => void;
}

function ComplimentRow({ comp, frag, columns, onEdit }: ComplimentRowProps) {
  return (
    <div
      onClick={onEdit}
      className="cursor-pointer hover-row"
      style={{
        display: 'grid',
        gridTemplateColumns: 'subgrid',
        gridColumn: '1 / -1',
        alignItems: 'start',
        minHeight: ROW_MIN_HEIGHT,
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--color-row-divider)',
      }}
    >
      {columns.map((col) => (
        <div key={col.id} style={{ textAlign: col.align ?? 'left' }}>
          {col.render(comp, frag)}
        </div>
      ))}
    </div>
  );
}

interface ComplimentMobileCardProps {
  comp: UserCompliment;
  frag: FragInfo;
  onEdit: () => void;
}

function ComplimentMobileCard({ comp, frag, onEdit }: ComplimentMobileCardProps) {
  return (
    <Button
      variant="ghost"
      onClick={onEdit}
      className="!block w-full h-auto text-left"
      style={{
        background: 'var(--color-cream)',
        border: '1px solid var(--color-cream-dark)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <FragranceCell name={frag.name} house={frag.house} type={frag.type} />
      </div>
      {comp.notes && (
        <div className="font-serif italic" style={{ fontSize: 'var(--text-note)', color: 'var(--color-meta-text)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
          {comp.notes}
        </div>
      )}
      <Button variant="primary" onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ width: '100%' }}>
        Edit
      </Button>
    </Button>
  );
}
