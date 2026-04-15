import { cn } from "@/lib/utils";

interface StatBoxProps {
  value: string | number;
  label: string;
  delta?: string;
  className?: string;
}

export function StatBox({ value, label, delta, className }: StatBoxProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        padding: "var(--space-5)",
      }}
      className={cn(className)}
    >
      <div
        className="font-display"
        style={{
          fontSize: "var(--text-2xl)",
          fontWeight: 500,
          lineHeight: "var(--leading-tight)",
          color: "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
      <div
        className="text-label"
        style={{ marginTop: "var(--space-1)", color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      {delta && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-success)",
            marginTop: "var(--space-1)",
          }}
        >
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
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        marginBottom: "var(--space-4)",
      }}
      className={cn(
        "grid [grid-template-columns:repeat(auto-fit,minmax(110px,1fr))]",
        className,
      )}
    >
      {children}
    </div>
  );
}
