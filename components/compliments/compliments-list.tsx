"use client";

import type { UserCompliment, FragranceType } from '@/types';
import { Pagination } from '@/components/ui/pagination';

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
      <div style={{ display: 'grid', gridTemplateColumns, columnGap: 'var(--space-10)' }}>
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
      {columns.map((col) => (
        <div key={col.id} style={{ minWidth: 0, textAlign: col.align ?? 'left' }}>
          {col.render(comp, frag)}
        </div>
      ))}
    </div>
  );
}
