"use client";
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, X } from '@/components/ui/Icons';
import { SearchInput } from '@/components/ui/search-input';

interface ActionItem {
  label: string;
  action: string;
  onSelect?: () => void;
}

interface ActionSection {
  label: string;
  items: ActionItem[];
}

interface FloatingActionButtonProps {
  onAction?: (action: string) => void;
}

const DEFAULT_SECTIONS: ActionSection[] = [
  {
    label: 'FRAGRANCES',
    items: [
      { label: 'Add fragrance to collection', action: 'add-fragrance' },
      { label: 'Edit a fragrance', action: 'edit-fragrance' },
      { label: 'Change fragrance status', action: 'change-status' },
      { label: 'Remove a fragrance', action: 'remove-fragrance' },
    ],
  },
  {
    label: 'COMPLIMENTS',
    items: [
      { label: 'Log a compliment', action: 'log-compliment' },
      { label: 'Edit a compliment', action: 'edit-compliment' },
      { label: 'Delete a compliment', action: 'delete-compliment' },
    ],
  },
  {
    label: 'WISHLIST',
    items: [
      { label: 'Add to wishlist', action: 'add-wishlist' },
      { label: 'Mark wishlist item as bought', action: 'wishlist-bought' },
    ],
  },
];

export function FloatingActionButton({
  onAction,
}: FloatingActionButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DEFAULT_SECTIONS;
    return DEFAULT_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.label.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0);
  }, [search]);

  const handleAction = (action: string) => {
    setMenuOpen(false);
    setSearch('');
    onAction?.(action);
  };

  return (
    <>
      {/* FAB — single + button, bottom-right */}
      <div className="fixed bottom-6 right-6 z-[200]">
        <Button
          variant="icon"
          onClick={() => setMenuOpen(true)}
          aria-label="Open actions"
          className="!w-12 !h-12 !rounded-full transition-opacity hover:opacity-90"
          style={{
            background: 'var(--color-navy)',
            color: 'var(--color-cream)',
            boxShadow: 'var(--shadow-md)',
            transitionDuration: 'var(--motion-fast)',
          }}
        >
          <Plus size={22} />
        </Button>
      </div>

      {/* Actions modal */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => { setMenuOpen(false); setSearch(''); }}
            className="fixed inset-0 z-[210]"
            style={{ background: 'var(--color-navy-backdrop)' }}
          />
          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Actions menu"
            className={cn(
              'fixed z-[220] bg-[var(--color-cream)] rounded-[var(--radius-lg)] overflow-hidden',
              // Desktop: centered
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[480px] max-h-[80dvh]',
              // Mobile: bottom sheet
              'max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:bottom-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none',
            )}
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-6 pb-4"
              style={{ borderBottom: '1px solid var(--color-cream-dark)' }}
            >
              <span
                className="font-sans font-medium uppercase"
                style={{ fontSize: 'var(--text-label)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-lg)' }}
              >
                Actions
              </span>
              <Button
                variant="icon"
                onClick={() => { setMenuOpen(false); setSearch(''); }}
                aria-label="Close"
                className="!w-8 !h-8 !rounded-[var(--radius-md)] text-[var(--color-navy)] hover:bg-[var(--color-sand-light)]"
              >
                <X size={16} />
              </Button>
            </div>

            {/* Search */}
            <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--color-cream-dark)' }}>
              <SearchInput
                autoFocus
                placeholder="Search actions..."
                value={search}
                onChange={setSearch}
              />
            </div>

            {/* Action list */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80dvh - 140px)' }}>
              {filteredSections.map((section, si) => (
                <div key={section.label}>
                  {si > 0 && (
                    <div style={{ height: '1px', background: 'var(--color-cream-dark)', margin: '0 24px' }} />
                  )}
                  <div
                    className="px-6 pt-4 pb-1 font-sans font-medium uppercase"
                    style={{ fontSize: 'var(--text-label)', color: 'var(--color-meta-text)', letterSpacing: 'var(--tracking-lg)' }}
                  >
                    {section.label}
                  </div>
                  {section.items.map((item, ii) => (
                    <Button
                      key={item.action}
                      variant="ghost"
                      onClick={() => handleAction(item.action)}
                      className="!w-full !justify-start !px-6 !rounded-none font-sans hover:bg-[var(--color-sand-light)]"
                      style={{
                        height: '44px',
                        fontSize: 'var(--text-base)',
                        color: 'var(--color-navy)',
                        borderBottom:
                          ii < section.items.length - 1
                            ? '1px solid var(--color-cream-dark)'
                            : 'none',
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              ))}
              {filteredSections.length === 0 && (
                <div
                  className="px-6 py-8 text-center font-sans"
                  style={{ fontSize: 'var(--text-sm)', color: 'rgba(30,45,69,0.8)' }}
                >
                  No actions match &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
