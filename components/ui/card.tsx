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

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-serif italic text-[var(--text-lg)] leading-tight text-[var(--color-navy)]', className)}>
      {children}
    </h3>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('flex items-center mt-4 pt-4 border-t border-[var(--color-cream-dark)]', className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-[var(--color-cream-dark)]', className)} />;
}
