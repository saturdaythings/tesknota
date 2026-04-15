import { cn } from "@/lib/utils";

interface FormGroupProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({
  label,
  error,
  children,
  className,
}: FormGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1 mb-4", className)}>
      <label className="font-[var(--font-sans)] text-xs tracking-[0.18em] uppercase text-[var(--color-sand)]">
        {label}
      </label>
      {children}
      {error && (
        <span className="font-[var(--font-sans)] text-xs text-[var(--color-destructive)]">
          {error}
        </span>
      )}
    </div>
  );
}

interface FormRowProps {
  children: React.ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-5", className)}>
      {children}
    </div>
  );
}

interface FieldOption {
  value: string;
  label: string;
}

interface FieldOptionsProps {
  options: FieldOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function FieldOptions({
  options,
  value,
  onChange,
  className,
}: FieldOptionsProps) {
  return (
    <div className={cn("flex gap-[5px] flex-wrap mt-[2px]", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange?.(opt.value)}
          className={cn(
            "px-[11px] py-[5px] border font-[var(--font-sans)] text-xs tracking-[0.1em] uppercase cursor-pointer select-none transition-all duration-[130ms]",
            value === opt.value
              ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-[var(--color-cream)]"
              : "border-[var(--color-cream-dark)] text-[var(--color-sand)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Base input/textarea field classes for use in FormGroup children
export const fieldClass =
  "border-0 border-b border-[var(--color-cream-dark)] bg-transparent py-[7px] text-[13px] font-[var(--font-sans)] text-[var(--color-navy)] outline-none transition-[border-color] duration-[140ms] w-full focus:border-[var(--color-accent)] placeholder:text-[var(--color-sand)]";

export const textareaClass =
  "border border-[var(--color-cream-dark)] bg-transparent p-[8px_10px] text-[13px] font-[var(--font-sans)] text-[var(--color-navy)] outline-none transition-[border-color] duration-[140ms] w-full resize-y min-h-[60px] leading-[1.5] focus:border-[var(--color-accent)] placeholder:text-[var(--color-sand)]";
