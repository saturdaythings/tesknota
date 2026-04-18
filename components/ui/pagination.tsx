"use client";

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@/components/ui/Icons';
import { PerPageControl } from '@/components/ui/per-page-control';

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

  const atFirst = page === 1;
  const atLast = page === totalPages;
  const showNav = totalPages > 1;

  if (!onPageSize && !showNav) return null;

  return (
    <div
      className="flex items-center justify-between flex-wrap"
      style={{ gap: 'var(--space-3)', paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-4)' }}
    >
      {onPageSize ? (
        <PerPageControl value={resolvedPageSize} onChange={(v) => { onPageSize(v); onPage(1); }} />
      ) : (
        <div />
      )}

      {showNav && (
        <div className="flex items-center max-sm:gap-3" style={{ gap: 'var(--space-2)' }}>
          <PagBtn onClick={() => onPage(1)} disabled={atFirst} title="First page">
            <ChevronsLeft size={13} />
          </PagBtn>
          <PagBtn onClick={() => onPage(page - 1)} disabled={atFirst} title="Previous page">
            <ChevronLeft size={13} />
          </PagBtn>

          <span
            className="font-sans select-none max-sm:text-xs"
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
        'flex items-center justify-center transition-colors max-sm:w-11 max-sm:h-11',
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
        transitionDuration: 'var(--motion-base)',
      }}
    >
      {children}
    </button>
  );
}
