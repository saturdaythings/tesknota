"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const textareaBase =
  "w-full min-h-24 px-3 py-[10px] bg-[var(--color-surface)] border border-[1.5px] border-[var(--color-border)] rounded-[var(--radius-sm)] font-sans text-[length:var(--text-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none resize-y transition-[border-color,box-shadow] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-subtle)] disabled:bg-[var(--color-surface-raised)] disabled:opacity-60 disabled:cursor-not-allowed";

const textareaError =
  "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:shadow-[0_0_0_3px_var(--color-danger-subtle)]";

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
        <label htmlFor={id} className="text-label mb-[var(--space-1)]">
          {label}
          {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(textareaBase, error && textareaError, className)}
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-[var(--space-1)] text-[length:var(--text-xs)] text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-meta mt-[var(--space-1)]">
          {hint}
        </p>
      )}
    </div>
  );
}
