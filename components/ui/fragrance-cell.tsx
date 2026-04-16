"use client";

import { Badge } from '@/components/ui/badge';
import type { FragranceType } from '@/types';

interface FragranceCellProps {
  name: string;
  house?: string;
  type?: FragranceType | null;
  secondary?: string;
  className?: string;
}

/**
 * Canonical column 1 for any fragrance list row.
 * Use on Compliments, Collection, Wishlist, and any future list page.
 *
 * Line 1: [Name: serif italic 20px] [TypeBadge 11px?] [+ Secondary: serif italic 16px]
 * Line 2: [House: sans uppercase tracking-0.1em 12px?]
 */
export function FragranceCell({ name, house, type, secondary, className }: FragranceCellProps) {
  return (
    <div className={`flex-none w-[220px] max-sm:w-full ${className ?? ''}`}>
      <div className="flex items-center gap-2 mb-1 overflow-hidden">
        <span
          className="font-serif italic truncate min-w-0"
          style={{ fontSize: '20px', color: 'var(--color-navy)', lineHeight: 1.2 }}
        >
          {name}
        </span>
        {type && (
          <Badge variant="neutral" className="flex-shrink-0 text-[11px] py-[2px]" style={{ color: 'rgba(30,45,69,0.8)' }}>
            {type}
          </Badge>
        )}
      </div>
      {secondary && (
        <div
          className="font-serif italic truncate mb-1"
          style={{ fontSize: '14px', color: 'var(--color-navy)' }}
        >
          + {secondary}
        </div>
      )}
      {house && (
        <div
          className="font-sans uppercase tracking-[0.1em]"
          style={{ fontSize: '12px', color: 'var(--color-navy)' }}
        >
          {house}
        </div>
      )}
    </div>
  );
}
