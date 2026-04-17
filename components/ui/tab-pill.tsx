"use client";

interface TabPillProps {
  label: string;
  sublabel?: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "underline";
}

export function TabPill({ label, sublabel, count, active, onClick, variant = "default" }: TabPillProps) {
  if (variant === "underline") {
    return (
      <button
        onClick={onClick}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "var(--space-1)",
          padding: "var(--space-3) var(--space-4) var(--space-3)",
          background: active ? "var(--color-cream-dark)" : "transparent",
          borderBottom: active ? "2px solid var(--color-navy)" : "2px solid transparent",
          cursor: "pointer",
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
        fontSize: '12px',
        fontWeight: 400,
        letterSpacing: '0.08em',
        padding: '6px 12px',
        borderRadius: '2px',
        background: active ? 'var(--color-navy)' : 'transparent',
        color: active ? 'var(--color-cream)' : 'var(--color-navy)',
        border: active ? '1px solid var(--color-navy)' : '1px solid rgba(30,45,69,0.8)',
      }}
    >
      {label}
      {count != null && count > 0 && (
        <span className="font-sans" style={{ fontSize: '11px', opacity: 0.8 }}>
          {count}
        </span>
      )}
    </button>
  );
}
