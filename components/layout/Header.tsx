"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMobileNav } from '@/lib/mobile-nav-context';
import { Search, Menu, Circle } from '@/components/ui/Icons';

interface HeaderProps {
  pageTitle: string;
  synced?: boolean;
  onSearch?: (query: string) => void;
  className?: string;
}

export function Header({ pageTitle, synced = true, onSearch, className }: HeaderProps) {
  const { toggle } = useMobileNav();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [query, setQuery] = useState('');

  return (
    <header
      className={cn(
        'flex items-center flex-shrink-0 z-[100]',
        'h-[56px] px-5 md:px-10',
        'border-b border-[var(--color-cream-dark)]',
        className,
      )}
      style={{ background: 'var(--color-cream)' }}
    >
      {/* Mobile: hamburger */}
      <button
        onClick={toggle}
        aria-label="Open navigation"
        className="md:hidden mr-3 p-1 bg-transparent border-none cursor-pointer text-[var(--color-navy)] hover:text-[var(--color-accent)] transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div
          className="font-sans font-medium uppercase leading-none"
          style={{
            fontSize: 'var(--text-xxs)',
            color: 'var(--color-navy)',
            letterSpacing: 'var(--tracking-lg)',
          }}
        >
          T&#280;SKNOTA
        </div>
        <div
          className="font-serif italic truncate"
          style={{ fontSize: 'var(--text-empty-title)', color: 'var(--color-navy)', lineHeight: 'var(--leading-tight)' }}
        >
          {pageTitle}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4">
        {/* Search — desktop always visible, mobile expands inline */}
        <div className={cn('flex items-center', searchExpanded ? 'flex-1' : '')}>
          {/* Mobile search toggle */}
          <button
            onClick={() => setSearchExpanded((v) => !v)}
            aria-label="Search"
            className="md:hidden p-2 bg-transparent border-none cursor-pointer transition-colors"
            style={{ color: 'var(--color-sand)' }}
          >
            <Search size={18} />
          </button>

          {/* Search input */}
          <div
            className={cn(
              'relative',
              'hidden md:flex items-center',
              searchExpanded && '!flex',
            )}
          >
            <Search
              size={15}
              className="absolute left-3 pointer-events-none"
              style={{ color: 'var(--color-meta-text)' }}
            />
            <input
              type="search"
              placeholder="Search fragrances..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="h-9 pl-9 pr-3 rounded-[2px] font-sans outline-none transition-[border-color] duration-150 focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy-mid)]"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 400,
                letterSpacing: 'var(--tracking-sm)',
                width: '220px',
                background: 'var(--color-cream)',
                border: '1px solid var(--color-meta-text)',
                color: 'var(--color-meta-text)',
              }}
            />
          </div>
        </div>

        {/* Sync dot */}
        <div className="flex items-center gap-1.5" title={synced ? 'Live' : 'Offline'}>
          <Circle
            size={8}
            fill={synced ? 'var(--color-live)' : 'var(--color-sand)'}
            style={{ color: synced ? 'var(--color-live)' : 'var(--color-sand)' }}
          />
        </div>
      </div>
    </header>
  );
}
