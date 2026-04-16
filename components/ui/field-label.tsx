interface FieldLabelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form field label — var(--text-xs) sans uppercase tracking-0.08em navy 400.
 * Use above every form input across all modals and forms.
 */
export function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <div
      className={`mb-1 font-sans font-normal uppercase ${className ?? ''}`}
      style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', letterSpacing: '0.08em' }}
    >
      {children}
    </div>
  );
}

export function OptionalTag() {
  return (
    <span
      className="normal-case font-normal"
      style={{ fontSize: '13px', letterSpacing: 0, color: 'var(--color-navy-mid)' }}
    >
      (optional)
    </span>
  );
}

export function RequiredMark() {
  return (
    <span
      className="font-normal"
      style={{ fontSize: '13px', letterSpacing: 0, color: 'var(--color-destructive)' }}
    >
      *
    </span>
  );
}
