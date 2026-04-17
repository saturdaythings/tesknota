"use client";

import { Badge } from '@/components/ui/badge';
import { shortFragType } from '@/lib/frag-utils';
import type { FragranceType } from '@/types';

interface FragranceCellProps {
  name: string;
  house?: string;
  type?: FragranceType | null;
  secondary?: string;
  className?: string;
}

export function FragranceCell({ name, house, type, secondary, className }: FragranceCellProps) {
  return (
    <div className={`min-w-0${className ? ` ${className}` : ''}`}>
      <div className="flex items-center gap-2 mb-1 min-w-0">
        <span className="font-serif italic flex-1 min-w-0 truncate" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)', lineHeight: 1.2 }}>
          {name}
        </span>
        {type && shortFragType(type) && (
          <Badge
            variant="neutral"
            className="flex-shrink-0 py-[2px]"
            style={{ fontSize: 'var(--text-label)', color: 'var(--color-meta-text)' }}
          >
            {shortFragType(type)}
          </Badge>
        )}
        {secondary && (
          <span className="font-serif italic flex-shrink-0" style={{ fontSize: 'var(--text-note)', color: 'var(--color-navy)' }}>
            + {secondary}
          </span>
        )}
      </div>
      {house && (
        <div className="font-sans uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-navy)' }}>
          {house}
        </div>
      )}
    </div>
  );
}
