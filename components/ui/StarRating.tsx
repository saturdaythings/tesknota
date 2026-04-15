"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  className?: string;
  readOnly?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 16,
  className,
  readOnly = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered ?? value;

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role={readOnly ? 'img' : 'group'}
      aria-label={`Rating: ${value} out of ${max}`}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= display;

        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHovered(starValue)}
            onMouseLeave={() => !readOnly && setHovered(null)}
            style={{ width: size, height: size, flexShrink: 0 }}
            className={cn(
              'p-0 bg-transparent border-none cursor-pointer transition-colors duration-100',
              readOnly && 'cursor-default pointer-events-none',
            )}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 16 16"
              fill={filled ? 'var(--color-navy)' : 'var(--color-sand-light)'}
              aria-hidden="true"
            >
              <path d="M8 1l1.854 3.756 4.146.602-3 2.924.708 4.131L8 10.25l-3.708 1.163.708-4.131-3-2.924 4.146-.602z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
