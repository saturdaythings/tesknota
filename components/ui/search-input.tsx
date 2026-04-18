"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <svg
        width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        style={{ position: "absolute", left: "10px", color: "var(--color-meta-text)", pointerEvents: "none", flexShrink: 0 }}
      >
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: "32px", paddingRight: value ? "32px" : "10px" }}
        className={cn(
          "w-full h-9 bg-[var(--color-cream)] border border-[var(--color-meta-text)] rounded-[var(--radius-sm)]",
          "font-sans text-[length:var(--text-sm)] text-[var(--color-navy)] [letter-spacing:var(--tracking-sm)]",
          "placeholder:text-[var(--color-navy-mid)] outline-none transition-[border-color] duration-150",
          "focus:border-[var(--color-accent)]",
        )}
        {...props}
      />

      {value && (
        <Button
          variant="icon"
          aria-label="Clear search"
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: "8px",
            width: "20px", height: "20px",
            color: "var(--color-meta-text)",
          }}
        >
          <svg style={{ width: "var(--text-sm)", height: "var(--text-sm)" }} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      )}
    </div>
  );
}
