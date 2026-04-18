import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className, padding, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-lg)] min-w-0',
        'border border-[var(--color-cream-dark)]',
        !padding && 'p-6',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{
        background: 'var(--color-row-hover)',
        padding: padding ?? undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
