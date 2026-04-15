"use client";

import { useId, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  function toggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  }

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
      ? options.find((o) => o.value === value[0])?.label ?? value[0]
      : `${value.length} selected`;

  return (
    <div className={cn("relative flex flex-col w-full", className)} ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          height: "40px",
          padding: "0 12px",
          background: "var(--color-cream)",
          border: "1px solid var(--color-cream-dark)",
          borderRadius: "3px",
          fontFamily: "var(--font-sans)",
          fontSize: "15px",
          outline: "none",
          cursor: "pointer",
          color: value.length > 0 ? "var(--color-navy)" : "var(--color-sand)",
          borderColor: open ? "var(--color-accent)" : "var(--color-cream-dark)",
          transition: "border-color 150ms",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{
            color: "var(--color-sand)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms",
            flexShrink: 0,
            marginLeft: "4px",
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable="true"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            zIndex: 100,
            background: "var(--color-cream)",
            border: "1px solid var(--color-cream-dark)",
            borderRadius: "3px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            maxHeight: "240px",
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={checked}
                onClick={() => toggle(opt.value)}
                style={{
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 12px",
                  fontSize: "14px",
                  fontFamily: "var(--font-sans)",
                  cursor: "pointer",
                  color: "var(--color-navy)",
                  background: checked ? "var(--color-sand-light)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!checked) (e.currentTarget as HTMLElement).style.background = "var(--color-cream-dark)";
                }}
                onMouseLeave={(e) => {
                  if (!checked) (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "1px solid var(--color-sand)",
                    borderRadius: "2px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: checked ? "var(--color-navy)" : "transparent",
                    borderColor: checked ? "var(--color-navy)" : "var(--color-sand)",
                  }}
                >
                  {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3l2.5 2.5L8 1" stroke="var(--color-cream)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
