"use client";

import { useEffect, useRef, useState } from "react";

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customOptions?: string[];
  onCustomAdd?: (value: string) => void;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  allowCustom = false,
  customOptions = [],
  onCustomAdd,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const allOptions: SearchableSelectOption[] = [
    ...options,
    ...customOptions.map((v) => ({ value: v, label: v })),
  ];
  const searchLower = search.trim().toLowerCase();
  const filtered = searchLower
    ? allOptions.filter((o) => o.label.toLowerCase().includes(searchLower))
    : allOptions;
  const hasExactMatch = filtered.some(
    (o) => o.value.toLowerCase() === searchLower,
  );
  const showAddOwn = allowCustom && searchLower.length > 0 && !hasExactMatch;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  function commit(next: string, isCustom = false) {
    if (isCustom && onCustomAdd && !customOptions.includes(next)) {
      onCustomAdd(next);
    }
    onChange(next);
    setSearch("");
    setOpen(false);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const total = filtered.length + (showAddOwn ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        commit(filtered[focusedIndex].value);
      } else if (showAddOwn && focusedIndex === filtered.length) {
        commit(search.trim(), true);
      } else if (showAddOwn && focusedIndex === -1) {
        commit(search.trim(), true);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
      setFocusedIndex(-1);
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left cursor-pointer bg-transparent border-0 border-b border-[var(--color-meta-text)] rounded-none font-sans outline-none focus:border-[var(--color-accent)] transition-[border-color] duration-150"
        style={{
          padding: "var(--space-2) 0",
          fontSize: "var(--text-base)",
          color: value ? "var(--color-navy)" : "var(--color-navy-mid)",
        }}
      >
        {value || placeholder}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: "var(--space-2)",
            background: "var(--color-cream)",
            border: "1px solid var(--color-meta-text)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div style={{ padding: "var(--space-2)" }}>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full font-sans font-normal bg-[var(--color-cream)] border border-[var(--color-meta-text)] rounded-[var(--radius-sm)] outline-none focus:border-[var(--color-accent)] transition-[border-color] duration-150 placeholder:text-[var(--color-navy-mid)]"
              style={{
                height: "36px",
                padding: "0 var(--space-3)",
                fontSize: "var(--text-sm)",
                color: "var(--color-navy)",
              }}
            />
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              const isFocused = i === focusedIndex;
              const bg = isSelected
                ? "var(--color-cream-dark)"
                : isFocused
                  ? "var(--color-row-hover)"
                  : "transparent";
              return (
                <div
                  key={opt.value}
                  onClick={() => commit(opt.value)}
                  onMouseEnter={() => setFocusedIndex(i)}
                  style={{
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-sm)",
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    color: "var(--color-navy)",
                    background: bg,
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
            {showAddOwn && (
              <>
                <div
                  style={{
                    height: "1px",
                    background: "var(--color-row-divider)",
                    margin: "var(--space-1) 0",
                  }}
                />
                <div
                  onClick={() => commit(search.trim(), true)}
                  onMouseEnter={() => setFocusedIndex(filtered.length)}
                  style={{
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 var(--space-3)",
                    fontSize: "var(--text-sm)",
                    fontFamily: "var(--font-sans)",
                    fontStyle: "italic",
                    cursor: "pointer",
                    color: "var(--color-navy)",
                    background:
                      focusedIndex === filtered.length
                        ? "var(--color-row-hover)"
                        : "transparent",
                  }}
                >
                  + Add &quot;{search.trim()}&quot;
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
