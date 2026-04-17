"use client";

import { shortFragType } from '@/lib/frag-utils';
import type { FragranceType } from '@/types';

interface FragranceCellProps {
  name: string;
  house?: string;
  type?: FragranceType | null;
  secondary?: string;
  isDupe?: boolean;
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

export function FragranceCell({ name, house, type, secondary, isDupe, className }: FragranceCellProps) {
  const concLabel = type ? shortFragType(type) : null;
  return (
    <div className={`min-w-0${className ? ` ${className}` : ''}`}>
      <div className="flex items-center gap-1.5 mb-1 min-w-0">
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
    </div>
  );
}
