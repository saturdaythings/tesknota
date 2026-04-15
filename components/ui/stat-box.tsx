import { cn } from "@/lib/utils";

interface StatBoxProps {
  value: string | number;
  label: string;
  delta?: string;
  className?: string;
}

export function StatBox({ value, label, delta, className }: StatBoxProps) {
  return (
    <div className={cn("bg-[var(--off)] px-5 py-[14px]", className)}>
      <div className="font-[var(--serif)] text-[34px] font-normal leading-none text-[var(--blue)]">
        {value}
      </div>
      <div className="font-[var(--mono)] text-xs tracking-[0.16em] uppercase text-[var(--ink3)] mt-[5px]">
        {label}
      </div>
      {delta && (
        <div className="font-[var(--mono)] text-xs text-[var(--s-want)] mt-[2px]">
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
      className={cn(
        "grid gap-px bg-[var(--b2)] border border-[var(--b2)] mb-4",
        "[grid-template-columns:repeat(auto-fit,minmax(110px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
