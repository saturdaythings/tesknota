"use client";

import { shortFragType } from '@/lib/frag-utils';
import { cn } from '@/lib/utils';
import type { FragranceType } from '@/types';

interface FragranceCellProps {
  name: string;
  house?: string;
  type?: FragranceType | null;
  secondary?: string;
  isDupe?: boolean;
  dupeFor?: string;
  className?: string;
}

const typeTagClass =
  'inline-flex items-center px-2 rounded-[2px] font-medium font-sans uppercase leading-none flex-shrink-0 py-[2px]';

const typeTagStyle: React.CSSProperties = {
  background: 'var(--color-cream-dark)',
  color: 'var(--color-meta-text)',
  fontSize: 'var(--text-label)',
  letterSpacing: 'var(--tracking-md)',
};

const dupeTagStyle: React.CSSProperties = {
  ...typeTagStyle,
  color: 'var(--color-navy)',
  border: '1px solid var(--color-navy)',
};

export function FragranceCell({ name, house, type, secondary, isDupe, dupeFor, className }: FragranceCellProps) {
  const concLabel = type ? shortFragType(type) : null;
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1 min-w-0">
          <span
            className="font-serif italic flex-1 min-w-0 truncate"
            style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)', lineHeight: 1.2 }}
          >
            {name}
            {secondary && <span className="ml-1.5"> + {secondary}</span>}
          </span>
          {concLabel && (
            <span className={typeTagClass} style={typeTagStyle}>
              {concLabel}
            </span>
          )}
          {isDupe && (
            <span className={typeTagClass} style={dupeTagStyle}>
              Dupe
            </span>
          )}
        </div>
        {house && (
          <div
            className="font-sans uppercase"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-md)',
              color: 'var(--color-navy)',
            }}
          >
            {house}
          </div>
        )}
        {isDupe && dupeFor && (
          <div
            className="font-sans max-sm:text-sm"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', fontStyle: 'italic' }}
          >
            dupe of {dupeFor}
          </div>
        )}
      </div>
    </div>
  );
}
