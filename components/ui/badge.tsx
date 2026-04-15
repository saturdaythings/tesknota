import { cn } from "@/lib/utils";

type BadgeVariant =
  | "collection"
  | "wishlist"
  | "previously_owned"
  | "want_to_smell"
  | "dont_like"
  | "finished"
  | "identify_later"
  | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  collection: {
    background: "var(--color-accent-subtle)",
    color: "var(--color-accent)",
  },
  wishlist: {
    background: "#EEF2FF",
    color: "#3730A3",
  },
  previously_owned: {
    background: "var(--color-surface-overlay)",
    color: "var(--color-text-secondary)",
  },
  want_to_smell: {
    background: "#FFF7ED",
    color: "var(--color-warning)",
  },
  dont_like: {
    background: "var(--color-danger-subtle)",
    color: "var(--color-danger)",
  },
  finished: {
    background: "var(--color-success-subtle)",
    color: "var(--color-success)",
  },
  identify_later: {
    background: "var(--color-warning-subtle)",
    color: "var(--color-warning)",
  },
  neutral: {
    background: "var(--color-surface-overlay)",
    color: "var(--color-text-secondary)",
  },
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      style={variantStyles[variant]}
      className={cn(
        "inline-flex items-center h-6 px-[10px] rounded-[var(--radius-full)] text-[length:var(--text-xs)] font-semibold tracking-[0.03em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
