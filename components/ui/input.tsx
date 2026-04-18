"use client";

import { useId, forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const inputBoxed =
  'font-sans font-normal text-[length:var(--text-sm)] text-[var(--color-navy)] ' +
  '[letter-spacing:var(--tracking-sm)] ' +
  'bg-[var(--color-cream)] border border-[var(--color-meta-text)] rounded-[var(--radius-sm)] ' +
  'placeholder:text-[var(--color-navy-mid)] outline-none transition-[border-color] duration-150 ' +
  'focus:border-[var(--color-accent)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed ' +
  'h-9 px-3';

const inputUnderline =
  'font-sans font-normal text-[length:var(--text-base)] text-[var(--color-navy)] ' +
  'bg-transparent border-0 border-b border-[var(--color-meta-text)] rounded-none ' +
  'placeholder:text-[var(--color-navy-mid)] outline-none transition-[border-color] duration-150 ' +
  'focus:border-[var(--color-accent)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed ' +
  'py-[var(--space-2)]';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  variant?: 'boxed' | 'underline';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id: idProp, required, leftIcon, variant = 'boxed', ...props }, ref) => {
    const generated = useId();
    const id = idProp ?? generated;
    const base = variant === 'underline' ? inputUnderline : inputBoxed;

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1 text-[length:var(--text-sm)] font-medium font-sans text-[var(--color-navy)]"
          >
            {label}
            {required && <span className="text-[var(--color-destructive)] ml-0.5">*</span>}
          </label>
        )}
        <div className={leftIcon ? 'relative' : undefined}>
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            required={required}
            aria-invalid={!!error}
            className={cn('w-full', base, leftIcon && 'pl-9', error && 'border-[var(--color-destructive)]', className)}
            {...props}
          />
        </div>
        {error && (
          <p role="alert" className="mt-1 text-[length:var(--text-sm)] text-[var(--color-destructive)]">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
