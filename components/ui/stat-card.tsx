import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaPositive = true,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex-1 min-w-0", className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col min-w-0">
          <span
            className="text-label"
            style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
              lineHeight: "var(--leading-tight)",
            }}
          >
            {value}
          </span>
          {delta && (
            <span
              style={{
                fontSize: "var(--text-xs)",
                marginTop: "var(--space-1)",
                color: deltaPositive
                  ? "var(--color-success)"
                  : "var(--color-danger)",
              }}
            >
              {delta}
            </span>
          )}
        </div>
        {icon && (
          <span
            style={{
              width: "20px",
              height: "20px",
              color: "var(--color-text-muted)",
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
