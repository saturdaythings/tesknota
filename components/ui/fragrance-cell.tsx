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

const concPillStyle: React.CSSProperties = {
  background: 'var(--color-cream-dark)',
  border: '1px solid var(--color-row-divider)',
  borderRadius: 'var(--radius-full)',
  padding: '2px var(--space-2)',
  fontSize: 'var(--text-label)',
  color: 'var(--color-meta-text)',
  letterSpacing: 'var(--tracking-wide)',
  flexShrink: 0,
  whiteSpace: 'nowrap',
  textTransform: 'uppercase',
};

const dupePillStyle: React.CSSProperties = {
  ...concPillStyle,
  border: '1px solid var(--color-navy)',
  color: 'var(--color-navy)',
};

export function FragranceCell({ name, house, type, secondary, isDupe, dupeFor, className }: FragranceCellProps) {
  const concLabel = type ? shortFragType(type) : null;
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-center mb-1 min-w-0" style={{ gap: 'var(--space-1)' }}>
        <span className="flex-1 min-w-0 truncate" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-note)', color: 'var(--color-navy)', lineHeight: 1.2 }}>
          {name}{secondary && <span className="ml-1.5"> + {secondary}</span>}
        </span>
        {concLabel && (
          <span className="font-sans" style={concPillStyle}>{concLabel}</span>
        )}
        {isDupe && (
          <span className="font-sans" style={dupePillStyle}>Dupe</span>
        )}
      </div>
      {house && (
        <div className="font-sans uppercase" style={{ fontSize: 'var(--text-label)', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-meta-text)' }}>
          {house}
        </div>
      )}
      {isDupe && dupeFor && (
        <div className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', fontStyle: 'italic' }}>
          dupe of {dupeFor}
        </div>
      )}
    </div>
  );
}
