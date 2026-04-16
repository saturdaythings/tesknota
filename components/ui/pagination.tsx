"use client";

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@/components/ui/Icons';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const atFirst = page === 1;
  const atLast = page === totalPages;

  return (
    <div
      className="flex items-center justify-center"
      style={{ gap: 'var(--space-2)', paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-6)' }}
    >
      <PagBtn onClick={() => onPage(1)} disabled={atFirst} title="First page">
        <ChevronsLeft size={13} />
      </PagBtn>
      <PagBtn onClick={() => onPage(page - 1)} disabled={atFirst} title="Previous page">
        <ChevronLeft size={13} />
      </PagBtn>

      <span
        className="font-sans select-none"
        style={{
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-sm)',
          color: 'var(--color-navy)',
          padding: '0 var(--space-3)',
        }}
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
  );
}

function PagBtn({
  onClick,
  disabled,
  children,
  title,
}: {
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
        disabled
          ? 'opacity-30 cursor-default'
          : 'cursor-pointer hover:bg-[var(--color-row-hover)]',
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
