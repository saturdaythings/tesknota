"use client";

const PAGE_SIZES = [
  { label: "25", value: 25 },
  { label: "50", value: 50 },
  { label: "All", value: 0 },
];

const BTN = {
  fontFamily: "var(--font-sans)",
  fontSize: "12px",
  fontWeight: 500 as const,
  padding: "4px 10px",
  border: "1px solid var(--color-sand-light)",
  background: "transparent",
  cursor: "pointer",
  borderRadius: "2px",
  transition: "border-color 120ms, color 120ms",
  color: "var(--color-navy-mid)",
  lineHeight: 1.4,
} as const;

const BTN_ACTIVE = {
  ...BTN,
  borderColor: "var(--color-accent)",
  color: "var(--color-accent)",
};

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

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "16px",
        paddingBottom: "8px",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      {/* Left: Show X per page */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "rgba(30,45,69,0.8)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginRight: "2px",
          }}
        >
          Show
        </span>
        {PAGE_SIZES.map((ps) => (
          <button
            key={ps.value}
            onClick={() => { onPageSize(ps.value); onPage(1); }}
            style={pageSize === ps.value ? BTN_ACTIVE : BTN}
            onMouseEnter={(e) => {
              if (pageSize !== ps.value) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-accent)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent)";
              }
            }}
            onMouseLeave={(e) => {
              if (pageSize !== ps.value) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-sand-light)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-navy-mid)";
              }
            }}
          >
            {ps.label}
          </button>
        ))}
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "12px",
            color: "rgba(30,45,69,0.8)",
            marginLeft: "8px",
          }}
        >
          {from}&ndash;{to} of {total}
        </span>
      </div>

      {/* Right: page navigation */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          {/* First */}
          <button
            style={{ ...BTN, opacity: page <= 1 ? 0.3 : 1, cursor: page <= 1 ? "default" : "pointer" }}
            disabled={page <= 1}
            onClick={() => onPage(1)}
            title="First page"
          >
            «
          </button>
          {/* Prev */}
          <button
            style={{ ...BTN, opacity: page <= 1 ? 0.3 : 1, cursor: page <= 1 ? "default" : "pointer" }}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            title="Previous page"
          >
            ‹
          </button>

          {/* Page numbers: show up to 5, centered around current */}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let p: number;
            if (totalPages <= 5) {
              p = i + 1;
            } else if (page <= 3) {
              p = i + 1;
            } else if (page >= totalPages - 2) {
              p = totalPages - 4 + i;
            } else {
              p = page - 2 + i;
            }
            return (
              <button
                key={p}
                onClick={() => onPage(p)}
                style={p === page ? BTN_ACTIVE : BTN}
              >
                {p}
              </button>
            );
          })}

          {/* Next */}
          <button
            style={{ ...BTN, opacity: page >= totalPages ? 0.3 : 1, cursor: page >= totalPages ? "default" : "pointer" }}
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            title="Next page"
          >
            ›
          </button>
          {/* Last */}
          <button
            style={{ ...BTN, opacity: page >= totalPages ? 0.3 : 1, cursor: page >= totalPages ? "default" : "pointer" }}
            disabled={page >= totalPages}
            onClick={() => onPage(totalPages)}
            title="Last page"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
