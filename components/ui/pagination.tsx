"use client";

const PAGE_SIZES = [
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "All", value: 0 },
];

interface Props {
  total: number;
  page: number;
  pageSize: number; // 0 = all
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}

export function Pagination({ total, page, pageSize, onPage, onPageSize }: Props) {
  const totalPages = pageSize === 0 ? 1 : Math.ceil(total / pageSize);
  const from = pageSize === 0 ? 1 : (page - 1) * pageSize + 1;
  const to = pageSize === 0 ? total : Math.min(page * pageSize, total);

  if (total === 0) return null;

  const btnBase =
    "inline-flex items-center justify-center h-8 min-w-[32px] px-[var(--space-2)] rounded-[var(--radius-sm)] text-[length:var(--text-xs)] font-medium border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent cursor-pointer transition-[background-color,border-color,color] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]";

  const activeBtnClass =
    "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent-subtle)]";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) var(--space-1)",
        marginBottom: "var(--space-4)",
        flexWrap: "wrap",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
        <span
          className="text-meta"
          style={{ marginRight: "var(--space-2)", color: "var(--color-text-muted)" }}
        >
          Show
        </span>
        {PAGE_SIZES.map((ps) => (
          <button
            key={ps.value}
            onClick={() => { onPageSize(ps.value); onPage(1); }}
            className={`${btnBase} ${pageSize === ps.value ? activeBtnClass : ""}`}
          >
            {ps.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <span className="text-meta" style={{ color: "var(--color-text-muted)" }}>
          {from}-{to} of {total}
        </span>
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            <button
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              className={btnBase}
              aria-label="Previous page"
            >
              &lsaquo;
            </button>
            <span className="text-meta" style={{ padding: "0 var(--space-2)", color: "var(--color-text-muted)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPage(page + 1)}
              disabled={page >= totalPages}
              className={btnBase}
              aria-label="Next page"
            >
              &rsaquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
