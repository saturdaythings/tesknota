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

export function MultiSelect({ options, value, onChange, placeholder = "Select...", className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  function toggle(val: string) {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  }

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const triggerLabel =
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
          height: "36px",
          padding: "0 12px",
          background: "var(--color-cream-dark)",
          border: open ? "1px solid var(--color-accent)" : "1px solid var(--color-row-divider)",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-sm)",
          outline: "none",
          cursor: "pointer",
          color: value.length > 0 ? "var(--color-navy)" : "var(--color-navy-mid)",
          transition: "border-color 150ms",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {triggerLabel}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
          style={{
            color: "var(--color-meta-text)",
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
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            width: "max-content",
            zIndex: 100,
            background: "var(--color-cream)",
            border: "1px solid var(--color-meta-text)",
            borderRadius: "3px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Search input */}
          <div style={{ padding: "var(--space-1)", borderBottom: "1px solid var(--color-row-divider)" }}>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-9 placeholder:text-[var(--color-navy-mid)] [letter-spacing:var(--tracking-sm)] outline-none transition-[border-color] duration-150 focus:border-[var(--color-accent)]"
              style={{
                padding: "0 var(--space-2)",
                background: "var(--color-cream)",
                border: "1px solid var(--color-meta-text)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
                color: "var(--color-navy)",
              }}
            />
          </div>

          {/* Options */}
          <div style={{ maxHeight: "220px", overflowY: "auto", padding: "var(--space-1) 0" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "0 12px", height: "36px", display: "flex", alignItems: "center", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-meta-text)" }}>
                No results
              </div>
            ) : filtered.map((opt) => {
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
                    fontSize: "var(--text-sm)",
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    color: "var(--color-navy)",
                    fontWeight: "var(--font-weight-normal)",
                    whiteSpace: "nowrap",
                    background: checked ? "var(--color-cream-dark)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = "var(--color-row-hover)"; }}
                  onMouseLeave={(e) => { if (!checked) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span
                    style={{
                      width: "13px", height: "13px",
                      border: "1px solid var(--color-meta-text)",
                      borderRadius: "2px",
                      flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: checked ? "var(--color-navy)" : "transparent",
                      borderColor: checked ? "var(--color-navy)" : "var(--color-meta-text)",
                    }}
                  >
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3l2.5 2.5L8 1" stroke="var(--color-cream)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
