import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Divider({ className, style }: DividerProps) {
  return (
    <hr
      aria-hidden="true"
      style={{
        height: "1px",
        background: "var(--color-border)",
        margin: "var(--space-4) 0",
        width: "100%",
        border: "none",
        ...style,
      }}
      className={cn(className)}
    />
  );
}
