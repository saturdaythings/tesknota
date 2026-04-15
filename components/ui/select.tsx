"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  error,
  disabled,
  className,
  id: idProp,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listId = `${id}-list`;

  const selectedOption = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(options.findIndex((o) => o.value === value) ?? 0);
        } else if (focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          close();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Escape":
        close();
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (!open || focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[role='option']");
    items[focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex, open]);

  return (
    <div className={cn("relative flex flex-col w-full", className)} ref={containerRef}>
      {label && (
        <label id={`${id}-label`} className="text-label mb-[var(--space-1)]">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={label ? `${id}-label` : undefined}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((o) => !o);
            if (!open) setFocusedIndex(options.findIndex((o) => o.value === value));
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex items-center justify-between w-full h-10 px-3 bg-[var(--color-surface)] border border-[1.5px] rounded-[var(--radius-sm)] font-sans text-[length:var(--text-base)] outline-none transition-[border-color,box-shadow] cursor-pointer focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_3px_var(--color-accent-subtle)] disabled:bg-[var(--color-surface-raised)] disabled:opacity-60 disabled:cursor-not-allowed",
          error
            ? "border-[var(--color-danger)]"
            : open
              ? "border-[var(--color-accent)] shadow-[0_0_0_3px_var(--color-accent-subtle)]"
              : "border-[var(--color-border)]",
        )}
      >
        <span
          className={
            selectedOption
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)]"
          }
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{
            color: "var(--color-text-muted)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform var(--transition-fast)",
            flexShrink: 0,
          }}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={listId}
          ref={listRef}
          role="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            zIndex: "var(--z-dropdown)",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            maxHeight: "280px",
            overflowY: "auto",
            padding: "var(--space-1) 0",
          }}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isFocused = i === focusedIndex;
            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                onMouseEnter={() => setFocusedIndex(i)}
                style={{
                  height: "38px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 var(--space-3)",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  color: isSelected
                    ? "var(--color-accent)"
                    : "var(--color-text-primary)",
                  fontWeight: isSelected ? 500 : 400,
                  background: isSelected
                    ? "var(--color-accent-subtle)"
                    : isFocused
                      ? "var(--color-surface-raised)"
                      : "transparent",
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
