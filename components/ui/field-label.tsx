interface FieldLabelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form field label — var(--text-xs) sans uppercase var(--tracking-wide) navy 400.
 * Use above every form input across all modals and forms.
 */
export function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <div
      className={`mb-1 font-sans font-normal uppercase ${className ?? ''}`}
      style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-wide)' }}
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
