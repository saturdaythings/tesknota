import { cn } from '@/lib/utils';

export type BadgeVariant =
  // New brand variants
  | 'current'
  | 'want'
  | 'finished'
  | 'sample'
  | 'dupe'
  | 'neutral'
  // Legacy variants (existing pages)
  | 'collection'
  | 'wishlist'
  | 'previously_owned'
  | 'want_to_smell'
  | 'dont_like'
  | 'identify_later';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  // New brand variants
  current: { background: 'var(--color-status-current)', color: 'var(--color-cream)' },
  want: { background: 'transparent', color: 'var(--color-navy)', border: '1px solid var(--color-status-want)' },
  finished: { background: 'var(--color-status-finished)', color: 'var(--color-cream)' },
  sample: { background: 'var(--color-status-sample)', color: 'var(--color-cream)' },
  dupe: { background: 'var(--color-status-dupe)', color: 'var(--color-cream)' },
  neutral: { background: 'var(--color-cream-dark)', color: 'var(--color-navy)' },
  // Legacy aliases
  collection: { background: 'var(--color-status-current)', color: 'var(--color-cream)' },
  wishlist: { background: 'transparent', color: 'var(--color-navy)', border: '1px solid var(--color-status-want)' },
  previously_owned: { background: 'var(--color-status-finished)', color: 'var(--color-cream)' },
  want_to_smell: { background: 'var(--color-cream-dark)', color: 'var(--color-navy)' },
  dont_like: { background: 'var(--color-destructive)', color: 'var(--color-cream)' },
  identify_later: { background: 'var(--color-cream-dark)', color: 'var(--color-navy)' },
};

/** Status badge - 13px Inter 500, all-caps, tracking 0.1em */
export function Badge({ variant = 'neutral', children, className, style }: BadgeProps) {
  return (
    <span
      style={{ ...variantStyles[variant], ...style }}
      className={cn(
        'inline-flex items-center px-2 py-[3px] rounded-[2px]',
        'text-[13px] font-medium font-sans uppercase tracking-[0.1em] leading-none',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Accord / note tag pill - 13px Inter 400, rounded pill */
export function TagPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-[2px] rounded-full',
        'text-[13px] font-sans font-normal',
        'bg-[var(--color-cream-dark)] text-[var(--color-navy)]',
        className,
      )}
    >
      {children}
    </span>
  );
}
