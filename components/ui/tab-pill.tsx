"use client";

interface TabPillProps {
  label: string;
  sublabel?: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "underline" | "selector";
}

export function TabPill({ label, sublabel, count, active, onClick, variant = "default" }: TabPillProps) {
  if (variant === "selector") {
    return (
      <button
        onClick={onClick}
        className="font-sans cursor-pointer transition-colors duration-100 flex-shrink-0 focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)]"
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 400,
          padding: 'var(--space-2) var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          background: active ? 'var(--color-cream-dark)' : 'transparent',
          color: 'var(--color-navy)',
          border: active ? '1px solid var(--color-navy)' : '1px solid var(--color-row-divider)',
          whiteSpace: 'nowrap',
          outline: 'none',
        }}
      >
        {label}
      </button>
    );
  }

  if (variant === "underline") {
    return (
      <button
        onClick={onClick}
        className="focus:outline-2 focus:outline-offset-2 focus:outline-[var(--color-accent)]"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "var(--space-1)",
          padding: "var(--space-3) var(--space-4) var(--space-3)",
          background: active ? "var(--color-cream-dark)" : "transparent",
          borderBottom: active ? "2px solid var(--color-navy)" : "2px solid transparent",
          cursor: "pointer",
          outline: "none",
          transition: "background 150ms, border-color 150ms",
        }}
      >
        <span style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: "var(--text-note)",
          color: "var(--color-navy)",
          lineHeight: 1.2,
        }}>
          {label}
        </span>
        {sublabel && (
          <span style={{
            fontFamily: "var(--font-sans)",
            fontStyle: "normal",
            fontSize: "var(--text-label)",
            letterSpacing: "var(--tracking-wide)",
            color: "var(--color-meta-text)",
            textTransform: "uppercase",
          }}>
            {sublabel}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 font-sans uppercase transition-colors duration-100 flex-shrink-0 cursor-pointer"
      style={{
        fontSize: 'var(--text-xs)',
        fontWeight: 400,
        letterSpacing: 'var(--tracking-wide)',
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: active ? 'var(--color-cream-dark)' : 'transparent',
        color: 'var(--color-navy)',
        border: active ? '1px solid var(--color-navy)' : '1px solid var(--color-row-divider)',
        outline: 'none',
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span className="font-sans" style={{ fontSize: 'var(--text-label)', opacity: 0.8 }}>
          {count}
        </span>
      )}
    </button>
  );
}
