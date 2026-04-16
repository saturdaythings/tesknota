"use client";

const SIZES = [
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "All", value: 0 },
];

interface PerPageControlProps {
  value: number; // 0 = All
  onChange: (value: number) => void;
}

export function PerPageControl({ value, onChange }: PerPageControlProps) {
  return (
    <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
      <span
        className="font-sans"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-navy)',
          letterSpacing: 'var(--tracking-sm)',
          marginRight: 'var(--space-1)',
        }}
      >
        Per page:
      </span>
      {SIZES.map((size, i) => (
        <span key={size.value} className="flex items-center" style={{ gap: 'var(--space-1)' }}>
          {i > 0 && (
            <span
              className="font-sans select-none"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', opacity: 0.35 }}
            >
              |
            </span>
          )}
          <button
            onClick={() => onChange(size.value)}
            className="font-sans"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-navy)',
              fontWeight: value === size.value ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0 var(--space-1)',
              letterSpacing: 'var(--tracking-sm)',
            }}
          >
            {size.label}
          </button>
        </span>
      ))}
    </div>
  );
}
