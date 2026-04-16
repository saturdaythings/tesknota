interface FieldLabelProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Form field label — 11px sans uppercase tracking-0.1em navy.
 * Use above every form input across all modals and forms.
 */
export function FieldLabel({ children, className }: FieldLabelProps) {
  return (
    <div
      className={`mb-1 font-sans font-medium uppercase ${className ?? ''}`}
      style={{ fontSize: '11px', color: 'var(--color-navy)', letterSpacing: '0.1em' }}
    >
      {children}
    </div>
  );
}

export function OptionalTag() {
  return (
    <span
      className="normal-case font-normal"
      style={{ letterSpacing: 0, color: 'rgba(30,45,69,0.7)' }}
    >
      (optional)
    </span>
  );
}
