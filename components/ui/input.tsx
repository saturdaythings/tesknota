"use client";

import { useId, forwardRef, TextareaHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full font-sans font-normal text-[length:var(--text-sm)] text-[var(--color-navy)] ' +
  '[letter-spacing:var(--tracking-sm)] ' +
  'bg-[var(--color-cream)] border border-[var(--color-meta-text)] rounded-[var(--radius-sm)] ' +
  'placeholder:text-[var(--color-navy-mid)] outline-none transition-[border-color] duration-150 ' +
  'focus:border-[var(--color-accent)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id: idProp, required, leftIcon, ...props }, ref) => {
    const generated = useId();
    const id = idProp ?? generated;

    return (
      <div className="flex flex-col w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1 text-[13px] font-medium font-sans text-[var(--color-navy)]"
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
            className={cn(inputBase, 'h-9 px-3', leftIcon && 'pl-9', error && 'border-[var(--color-destructive)]', className)}
            {...props}
          />
        </div>
        {error && (
          <p role="alert" className="mt-1 text-[13px] text-[var(--color-destructive)]">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id: idProp, required, ...props }: TextareaProps) {
  const generated = useId();
  const id = idProp ?? generated;

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1 text-[13px] font-medium font-sans text-[var(--color-navy)]"
        >
          {label}
          {required && <span className="text-[var(--color-destructive)] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        required={required}
        aria-invalid={!!error}
        className={cn(
          inputBase,
          'min-h-[80px] p-3 resize-y',
          error && 'border-[var(--color-destructive)]',
          className,
        )}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1 text-[13px] text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
