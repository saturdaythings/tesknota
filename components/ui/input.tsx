"use client";

import { useId, TextareaHTMLAttributes, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full font-sans font-normal text-[length:var(--text-sm)] text-[var(--color-navy)] ' +
  'bg-[var(--color-cream-dark)] border border-[var(--color-row-divider)] rounded-[3px] ' +
  'placeholder:text-[var(--color-navy-mid)] outline-none transition-[border-color] duration-150 ' +
  'focus:border-[var(--color-navy)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id: idProp, required, ...props }: InputProps) {
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
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        className={cn(inputBase, 'h-9 px-3', error && 'border-[var(--color-destructive)]', className)}
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
