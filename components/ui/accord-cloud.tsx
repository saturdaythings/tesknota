interface AccordCloudProps {
  accords: [string, number][];
}

export function AccordCloud({ accords }: AccordCloudProps) {
  if (!accords.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
      {accords.map(([accord], i) => (
        <span
          key={accord}
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: i === 0 ? 500 : 400,
            padding: "var(--space-1) var(--space-3)",
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text-secondary)",
            cursor: "default",
            letterSpacing: "0.03em",
          }}
        >
          {accord}
        </span>
      ))}
    </div>
  );
}
