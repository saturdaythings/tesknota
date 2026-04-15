"use client";

import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FilterChip({
  label,
  active,
  onClick,
  className,
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-[var(--space-4)] h-9 text-[length:var(--text-xs)] font-medium tracking-[0.06em] uppercase cursor-pointer select-none whitespace-nowrap transition-[background-color,color,border-color] border-r border-[var(--color-border)] last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]",
        className,
      )}
    >
      {label}
    </button>
  );
}

interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
        width: "fit-content",
        flexWrap: "wrap",
      }}
      className={cn(className)}
    >
      {children}
    </div>
  );
}

interface FamilyChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function FamilyChip({
  label,
  active,
  onClick,
  className,
}: FamilyChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-[var(--space-3)] h-8 border rounded-[var(--radius-full)] text-[length:var(--text-xs)] font-medium tracking-[0.04em] cursor-pointer transition-[background-color,color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
        className,
      )}
    >
      {label}
    </button>
  );
}
