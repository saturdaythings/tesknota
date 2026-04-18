"use client";

import { FragranceCell } from '@/components/ui/fragrance-cell';
import { Button } from '@/components/ui/button';
import type { FragranceType } from '@/types';

interface FragranceRowEditorialProps {
  name: string;
  house?: string;
  type?: FragranceType | null;
  secondary?: string;
  meta?: string;
  notes?: string;
  date?: string;
  onClick?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export function FragranceRowEditorial({
  name,
  house,
  type,
  secondary,
  meta,
  notes,
  date,
  onClick,
  onAction,
  actionLabel,
}: FragranceRowEditorialProps) {
  return (
    <div
      onClick={onClick}
      className="flex gap-6 items-start cursor-pointer hover-row max-sm:flex-col max-sm:gap-2"
      style={{
        minHeight: 'var(--size-row-min)',
        padding: 'var(--space-4) 0',
        borderBottom: '1px solid var(--color-row-divider)',
      }}
    >
      {/* Column 1: fragrance identity */}
      <FragranceCell name={name} house={house} type={type} secondary={secondary} />

      {/* Column 2: meta + notes */}
      {(meta || notes) && (
        <div className="flex-1 min-w-0">
          {meta && (
            <div
              className="font-sans mb-1"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}
            >
              {meta}
            </div>
          )}
          {notes && (
            <div
              className="font-serif italic"
              style={{ fontSize: 'var(--text-note)', color: 'var(--color-notes-text)', lineHeight: 'var(--leading-relaxed)' }}
            >
              {notes}
            </div>
          )}
        </div>
      )}

      {/* Column 3: date + optional action */}
      <div className="flex items-start gap-3 flex-shrink-0">
        {date && (
          <div
            className="font-sans flex-shrink-0 text-right"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '72px' }}
          >
            {date}
          </div>
        )}
        {onAction && (
          <Button
            variant="primary"
            onClick={(e) => { e.stopPropagation(); onAction(); }}
            className="whitespace-nowrap flex-shrink-0"
          >
            {actionLabel ?? 'Action'}
          </Button>
        )}
      </div>
    </div>
  );
}
