"use client";

import { useId, useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

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
  /**
   * "full"  — fills its container (default, use in forms)
   * "auto"  — sizes to the longest option label; never wraps regardless of option text length
   */
  size?: 'full' | 'auto';
  /** Replace the default chevron with a custom icon node. The node is rendered as-is (no rotation on open). */
  icon?: React.ReactNode;
}

const triggerBase =
  'flex items-center justify-between w-full h-9 px-3 ' +
  'bg-[var(--color-cream-dark)] rounded-[3px] ' +
  'font-sans outline-none transition-[border-color] duration-150 cursor-pointer ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  disabled,
  className,
  id: idProp,
  size = 'full',
  icon,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listId = `${id}-list`;

  const selectedOption = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(options.findIndex((o) => o.value === value));
        } else if (focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          close();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) { setOpen(true); setFocusedIndex(0); }
        else setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Escape':
        close();
        break;
    }
  };

  return (
    <div
      className={cn('relative flex flex-col', size === 'full' ? 'w-full' : 'w-fit', className)}
      ref={containerRef}
    >
      {label && (
        <label
          id={`${id}-label`}
          className="mb-1 font-sans font-medium text-[var(--text-sm)] text-[var(--color-navy)]"
        >
          {label}
        </label>
      )}

      {/* Grid wrapper: when size="auto" the hidden sizer forces width to longest option */}
      <div style={size === 'auto' ? { display: 'grid' } : undefined}>
        {size === 'auto' && (
          <span
            aria-hidden="true"
            style={{
              gridArea: '1 / 1',
              visibility: 'hidden',
              pointerEvents: 'none',
              height: 0,
              overflow: 'hidden',
              padding: '0 48px 0 12px',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
            }}
          >
            {options.reduce((longest, opt) => opt.label.length > longest.length ? opt.label : longest, placeholder)}
          </span>
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
          className={cn(triggerBase, size === 'full' && 'w-full')}
          style={{
            gridArea: size === 'auto' ? '1 / 1' : undefined,
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            border: error
              ? '1px solid var(--color-destructive)'
              : open
              ? '1px solid var(--color-navy)'
              : '1px solid var(--color-row-divider)',
          }}
        >
          <span style={{ color: selectedOption ? 'var(--color-navy)' : 'var(--color-navy-mid)', whiteSpace: 'nowrap' }}>
            {selectedOption?.label ?? placeholder}
          </span>
          {icon ?? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              style={{
                color: 'var(--color-meta-text)',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms',
                flexShrink: 0,
              }}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            zIndex: 50,
            background: 'var(--color-cream)',
            border: '1px solid var(--color-row-divider)',
            borderRadius: '3px',
            boxShadow: 'var(--shadow-md)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: 'var(--space-1) 0',
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
                onClick={() => { onChange(option.value); close(); }}
                onMouseEnter={() => setFocusedIndex(i)}
                style={{
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 var(--space-3)',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  color: 'var(--color-navy)',
                  fontWeight: 'var(--font-weight-normal)',
                  whiteSpace: 'nowrap',
                  background: isSelected
                    ? 'var(--color-cream-dark)'
                    : isFocused
                    ? 'var(--color-row-hover)'
                    : 'transparent',
                }}
              >
                {option.label}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1 text-[var(--text-sm)] text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
