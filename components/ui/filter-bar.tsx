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
        "px-[14px] py-[5px] font-[var(--mono)] text-xs tracking-[0.12em] uppercase cursor-pointer select-none whitespace-nowrap transition-all duration-[140ms] border-r border-[var(--b2)] last:border-r-0",
        active
          ? "bg-[var(--blue)] text-[var(--warm2)]"
          : "text-[var(--ink3)] hover:text-[var(--blue)] hover:bg-[var(--blue4)]",
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
      className={cn(
        "flex border border-[var(--b3)] w-fit flex-wrap mb-[18px]",
        className,
      )}
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
        "px-[10px] py-[3px] border rounded-xl font-[var(--mono)] text-xs tracking-[0.06em] cursor-pointer transition-all duration-[140ms]",
        active
          ? "border-[var(--blue1)] bg-[rgba(var(--blue1-ch),0.15)] text-[var(--blue1)]"
          : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue1)] hover:text-[var(--blue1)]",
        className,
      )}
    >
      {label}
    </button>
  );
}
