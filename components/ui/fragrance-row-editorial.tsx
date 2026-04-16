"use client";

interface FragranceRowEditorialProps {
  name: string;
  house?: string;
  secondary?: string;
  meta?: string;
  notes?: string;
  date?: string;
  onClick?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export function FragranceRowEditorial({
  name,
  house,
  secondary,
  meta,
  notes,
  date,
  onClick,
  onAction,
  actionLabel,
}: FragranceRowEditorialProps) {
  return (
    <div
      onClick={onClick}
      className="flex gap-4 items-start cursor-pointer transition-colors duration-100"
      style={{
        minHeight: '80px',
        padding: '16px 0',
        borderBottom: '1px solid var(--color-cream-dark)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(232,224,208,0.3)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Left: fragrance info */}
      <div className="flex-1 min-w-0 pr-4">
        {/* Line 1: frag name + secondary */}
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className="font-serif italic"
            style={{ fontSize: '20px', color: 'var(--color-navy)', lineHeight: 1.2 }}
          >
            {name}
          </span>
          {secondary && (
            <span
              className="font-serif italic"
              style={{ fontSize: '14px', color: 'rgba(30,45,69,0.7)' }}
            >
              + {secondary}
            </span>
          )}
        </div>

        {/* Line 2: house */}
        {house && (
          <div
            className="font-sans uppercase tracking-[0.1em] mb-1"
            style={{ fontSize: '12px', color: 'var(--color-navy)' }}
          >
            {house}
          </div>
        )}

        {/* Line 3: meta (relation · gender · location) */}
        {meta && (
          <div
            className="font-sans mb-1"
            style={{ fontSize: '12px', color: 'rgba(30,45,69,0.65)' }}
          >
            {meta}
          </div>
        )}

        {/* Line 4: notes */}
        {notes && (
          <div
            className="font-serif italic"
            style={{ fontSize: '15px', color: 'rgba(30,45,69,0.7)', lineHeight: 1.6 }}
          >
            {notes}
          </div>
        )}
      </div>

      {/* Right: date + action */}
      <div className="flex items-start gap-3 flex-shrink-0">
        {date && (
          <div
            className="font-sans flex-shrink-0 text-right"
            style={{ fontSize: '14px', color: 'rgba(30,45,69,0.7)', minWidth: '72px' }}
          >
            {date}
          </div>
        )}
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="font-sans text-xs tracking-[0.06em] px-3 py-[4px] border border-[var(--color-cream-dark)] text-[var(--color-navy)] hover:border-[var(--color-navy)] transition-colors whitespace-nowrap flex-shrink-0"
          >
            {actionLabel ?? "Action"}
          </button>
        )}
      </div>
    </div>
  );
}
