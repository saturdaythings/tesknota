"use client";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type ButtonSize = "md" | "sm";

type BaseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type IconButtonProps = BaseButtonProps & {
  variant: "icon";
  "aria-label": string;
};

type NonIconButtonProps = BaseButtonProps & {
  variant?: Exclude<ButtonVariant, "icon">;
};

type ButtonProps = IconButtonProps | NonIconButtonProps;

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none cursor-pointer border-none font-sans font-medium transition-[background-color,border-color,color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-hover)]",
  secondary:
    "bg-transparent border border-[1.5px] border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-text-inverse)] hover:bg-[var(--color-danger-hover)]",
  icon: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-overlay)] hover:text-[var(--color-text-primary)]",
};

const sizes: Record<ButtonSize, Record<ButtonVariant, string>> = {
  md: {
    primary: "h-10 px-4 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    secondary: "h-10 px-4 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    ghost: "h-10 px-4 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    danger: "h-10 px-4 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    icon: "h-10 w-10 rounded-[var(--radius-sm)]",
  },
  sm: {
    primary: "h-8 px-3 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    secondary: "h-8 px-3 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    ghost: "h-8 px-3 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    danger: "h-8 px-3 text-[length:var(--text-sm)] rounded-[var(--radius-sm)]",
    icon: "h-8 w-8 rounded-[var(--radius-sm)]",
  },
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      style={{ transition: `background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast)` }}
      className={cn(base, variants[variant], sizes[size][variant], className)}
      {...props}
    />
  );
}
