"use client";

interface TabPillProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

export function TabPill({ label, count, active, onClick }: TabPillProps) {
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
