"use client";

import { useId, useState, useRef, useEffect, useCallback, SelectHTMLAttributes } from 'react';
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
}

const triggerBase =
  'flex items-center justify-between w-full h-9 px-3 ' +
  'bg-[var(--color-cream)] rounded-[3px] ' +
  'font-sans text-[15px] outline-none transition-[border-color] duration-150 cursor-pointer ' +
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
    <div className={cn('relative flex flex-col w-full', className)} ref={containerRef}>
      {label && (
        <label id={`${id}-label`} className="mb-1 text-[13px] font-medium font-sans text-[var(--color-navy)]">
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
        className={cn(triggerBase, className)}
        style={{
          border: error ? '1px solid var(--color-destructive)' : open ? '1px solid var(--color-accent)' : '1px solid rgba(30,45,69,0.8)',
        }}
      >
        <span style={{ color: selectedOption ? 'var(--color-navy)' : 'var(--color-sand)' }}>
          {selectedOption?.label ?? placeholder}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          style={{
            color: 'var(--color-sand)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
            flexShrink: 0,
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

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
            zIndex: 50,
            background: 'var(--color-cream)',
            border: '1px solid rgba(30,45,69,0.8)',
            borderRadius: '3px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '4px 0',
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
                  padding: '0 12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  color: 'var(--color-navy)',
                  fontWeight: 400,
                  background: isSelected
                    ? 'var(--color-cream-dark)'
                    : isFocused
                    ? 'rgba(232,224,208,0.3)'
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
        <p role="alert" className="mt-1 text-[13px] text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
