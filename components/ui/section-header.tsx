import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  right?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, right, className }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--color-border)",
        paddingBottom: "var(--space-2)",
        marginBottom: "var(--space-4)",
      }}
      className={cn(className)}
    >
      <h2
        className="font-display"
        style={{
          fontSize: "var(--text-md)",
          fontWeight: 500,
          color: "var(--color-text-primary)",
        }}
      >
        {title}
      </h2>
      {right && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          {right}
        </div>
      )}
    </div>
  );
}
