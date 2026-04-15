"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  label?: string;
  className?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  label,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-[var(--mono)] text-xs tracking-[0.06em] px-3 py-[6px] border transition-colors border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
      >
        {selectedOption?.label || label || "Select"} &#9662;
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 bg-[var(--off)] border border-[var(--b3)] shadow-sm mt-1 w-[160px] overflow-y-auto max-h-[280px]">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 font-[var(--mono)] text-xs transition-colors ${
                value === option.value
                  ? "text-[var(--blue)] bg-[var(--blue-tint)]"
                  : "text-[var(--ink2)] hover:bg-[var(--b1)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
