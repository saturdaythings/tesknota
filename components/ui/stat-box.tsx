import { cn } from "@/lib/utils";

interface StatBoxProps {
  value: string | number;
  label: string;
  delta?: string;
  className?: string;
}

export function StatBox({ value, label, delta, className }: StatBoxProps) {
  return (
    <div className={cn("px-5 py-[14px]", className)} style={{ background: 'var(--color-cream-dark)' }}>
      {/* component-internal: text-[34px] — no token between --text-note (16px) and --text-empty-title (22px) */}
      <div className="font-serif italic leading-none text-[34px]" style={{ color: 'var(--color-navy)' }}>
        {value}
      </div>
      {/* component-internal: tracking-[0.16em] — no token between --tracking-lg and --tracking-xl; mt-[5px] — no space token */}
      <div className="font-sans text-xs uppercase tracking-[0.16em] mt-[5px]" style={{ color: 'var(--color-meta-text)' }}>
        {label}
      </div>
      {delta && (
        <div className="font-sans text-xs mt-[2px]" style={{ color: 'var(--color-accent)' }}>
          {delta}
        </div>
      )}
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatsGrid({ children, className }: StatsGridProps) {
  return (
    <div
      className={cn("grid gap-px mb-4 [grid-template-columns:repeat(auto-fit,minmax(110px,1fr))]", className)}
      style={{ background: 'var(--color-sand-light)', border: '1px solid var(--color-sand-light)' }}
    >
      {children}
    </div>
  );
}
