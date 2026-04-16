"use client";

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@/components/ui/Icons';

const PAGE_SIZES = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: 'All', value: 0 },
];

interface PaginationProps {
  page: number;
  onPage: (page: number) => void;
  /** New API: pass totalPages directly */
  totalPages?: number;
  /** Legacy API: pass total + pageSize and totalPages is computed */
  total?: number;
  pageSize?: number;
  onPageSize?: (size: number) => void;
}

export function Pagination({ page, onPage, totalPages: totalPagesProp, total, pageSize, onPageSize }: PaginationProps) {
  const resolvedTotal = total ?? 0;
  const resolvedPageSize = pageSize ?? 25;
  const totalPages = totalPagesProp ?? (resolvedPageSize === 0 ? 1 : Math.ceil(resolvedTotal / resolvedPageSize));

  if (resolvedTotal === 0 && totalPagesProp === undefined) return null;
  if (totalPages <= 1 && !onPageSize) return null;

  const atFirst = page === 1;
  const atLast = page === totalPages;

  return (
    <div
      className="flex items-center justify-between flex-wrap"
      style={{ gap: 'var(--space-3)', paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-4)' }}
    >
      {/* Per-page selector (legacy pages) */}
      {onPageSize ? (
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <span
            className="font-sans uppercase"
            style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-sm)', color: 'var(--color-meta-text)' }}
          >
            Show
          </span>
          {PAGE_SIZES.map((ps) => (
            <button
              key={ps.value}
              onClick={() => { onPageSize(ps.value); onPage(1); }}
              className="font-sans transition-colors"
              style={{
                height: 'var(--space-8)',
                padding: '0 var(--space-2)',
                border: '1px solid var(--color-sand-light)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                fontSize: 'var(--text-xs)',
                letterSpacing: 'var(--tracking-sm)',
                cursor: 'pointer',
                color: resolvedPageSize === ps.value ? 'var(--color-accent)' : 'var(--color-navy-mid)',
                borderColor: resolvedPageSize === ps.value ? 'var(--color-accent)' : 'var(--color-sand-light)',
              }}
            >
              {ps.label}
            </button>
          ))}
          {resolvedPageSize > 0 && (
            <span
              className="font-sans"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', marginLeft: 'var(--space-2)' }}
            >
              {(page - 1) * resolvedPageSize + 1}–{Math.min(page * resolvedPageSize, resolvedTotal)} of {resolvedTotal}
            </span>
          )}
        </div>
      ) : (
        <div />
      )}

      {/* Nav */}
      {totalPages > 1 && (
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <PagBtn onClick={() => onPage(1)} disabled={atFirst} title="First page">
            <ChevronsLeft size={13} />
          </PagBtn>
          <PagBtn onClick={() => onPage(page - 1)} disabled={atFirst} title="Previous page">
            <ChevronLeft size={13} />
          </PagBtn>

          <span
            className="font-sans select-none"
            style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-sm)', color: 'var(--color-navy)', padding: '0 var(--space-3)' }}
          >
            {page} of {totalPages}
          </span>

          <PagBtn onClick={() => onPage(page + 1)} disabled={atLast} title="Next page">
            <ChevronRight size={13} />
          </PagBtn>
          <PagBtn onClick={() => onPage(totalPages)} disabled={atLast} title="Last page">
            <ChevronsRight size={13} />
          </PagBtn>
        </div>
      )}
    </div>
  );
}

function PagBtn({ onClick, disabled, children, title }: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={title}
      className={cn(
        'flex items-center justify-center transition-colors',
        disabled ? 'opacity-30 cursor-default' : 'cursor-pointer hover:bg-[var(--color-row-hover)]',
      )}
      style={{
        width: 'var(--space-8)',
        height: 'var(--space-8)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-sand-light)',
        background: 'transparent',
        color: 'var(--color-navy)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </button>
  );
}
