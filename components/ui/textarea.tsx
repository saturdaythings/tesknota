"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const textareaBase =
  'w-full min-h-[80px] font-sans font-normal text-[length:var(--text-sm)] text-[var(--color-navy)] ' +
  '[letter-spacing:var(--tracking-sm)] ' +
  'bg-[var(--color-cream)] border border-[var(--color-meta-text)] rounded-[var(--radius-sm)] ' +
  'placeholder:text-[var(--color-navy-mid)] outline-none resize-y transition-[border-color] duration-150 ' +
  'focus:border-[var(--color-accent)] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export function Textarea({
  label,
  error,
  hint,
  required,
  className,
  id: idProp,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className="flex flex-col w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-[var(--space-1)] font-sans font-normal uppercase text-[length:var(--text-xs)] text-[var(--color-meta-text)]"
          style={{ letterSpacing: 'var(--tracking-wide)' }}
        >
          {label}
          {required && <span className="text-[var(--color-destructive)] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(textareaBase, 'p-[var(--space-3)]', error && 'border-[var(--color-destructive)]', className)}
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-[var(--space-1)] font-sans text-[length:var(--text-xs)] text-[var(--color-destructive)]"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-[var(--space-1)] font-sans text-[length:var(--text-xs)] text-[var(--color-meta-text)]">
          {hint}
        </p>
      )}
    </div>
  );
}
