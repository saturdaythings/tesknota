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

  return (
    <div className="flex items-center justify-between py-3 px-1 mb-4">
      <div className="flex items-center gap-1">
        <span className="font-[var(--mono)] text-xs text-[var(--ink4)] mr-2">Show</span>
        {PAGE_SIZES.map((ps) => (
          <button
            key={ps.value}
            onClick={() => { onPageSize(ps.value); onPage(1); }}
            className={`font-[var(--mono)] text-xs px-2 py-[3px] border transition-colors ${pageSize === ps.value ? "border-[var(--blue)] text-[var(--blue)]" : "border-[var(--b3)] text-[var(--ink3)] hover:border-[var(--blue)] hover:text-[var(--blue)]"}`}
          >
            {ps.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-[var(--mono)] text-xs text-[var(--ink4)]">
          {from}-{to} of {total}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              className="font-[var(--mono)] text-xs px-2 py-[3px] border border-[var(--b3)] text-[var(--ink3)] disabled:opacity-30 hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
            >
              &lsaquo;
            </button>
            <span className="font-[var(--mono)] text-xs text-[var(--ink3)] px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPage(page + 1)}
              disabled={page >= totalPages}
              className="font-[var(--mono)] text-xs px-2 py-[3px] border border-[var(--b3)] text-[var(--ink3)] disabled:opacity-30 hover:border-[var(--blue)] hover:text-[var(--blue)] transition-colors"
            >
              &rsaquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
