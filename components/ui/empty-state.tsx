interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--space-16) var(--space-8)",
      }}
    >
      <span
        style={{
          width: "48px",
          height: "48px",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <h3
        className="font-serif italic"
        style={{ fontSize: "var(--text-empty-title)", fontWeight: "var(--font-weight-normal)", lineHeight: "var(--leading-tight)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}
      >
        {title}
      </h3>
      <p
        className="font-sans"
        style={{
          fontSize: "var(--text-ui)",
          color: "var(--color-sand)",
          maxWidth: "36ch",
          textAlign: "center",
          marginBottom: action ? "var(--space-6)" : 0,
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
