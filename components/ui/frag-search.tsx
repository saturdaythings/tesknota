"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useData } from '@/lib/data-context';
import { FragranceProfileModal } from '@/components/collection/fragrance-profile-modal';
import type { CommunityFrag } from '@/types';

export function FragSearch() {
  const { communityFrags } = useData();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CommunityFrag | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const results = query.trim().length === 0
    ? []
    : communityFrags
        .filter((f) =>
          f.fragranceName.toLowerCase().includes(query.toLowerCase()) ||
          f.fragranceHouse.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8);

  const showDropdown = open && (results.length > 0 || query.trim().length > 0);

  return (
    <>
      <FragranceProfileModal frag={selected} onClose={() => setSelected(null)} />
      <div ref={containerRef} className="relative" style={{ width: '200px' }}>
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-meta-text)' }}
          />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Find fragrances..."
            className="w-full h-9 pl-9 pr-3 rounded-[2px] font-sans outline-none transition-[border-color] duration-150 focus:border-[var(--color-accent)] placeholder:text-[var(--color-navy-mid)]"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-normal)',
              letterSpacing: 'var(--tracking-sm)',
              background: 'var(--color-cream)',
              border: '1px solid var(--color-meta-text)',
              color: query ? 'var(--color-navy)' : 'var(--color-meta-text)',
            }}
          />
        </div>
        {showDropdown && (
          <div
            className="absolute z-[200] overflow-y-auto"
            style={{
              top: 'calc(100% + 4px)',
              right: 0,
              background: 'var(--color-cream)',
              border: '1px solid var(--color-meta-text)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '280px',
              minWidth: '240px',
            }}
          >
            {results.map((f) => (
              <div
                key={f.fragranceId}
                onMouseDown={() => { setQuery(''); setOpen(false); setSelected(f); }}
                className="flex flex-col justify-center cursor-pointer transition-colors"
                style={{ height: 'var(--space-12)', padding: '0 var(--space-3)', borderBottom: '1px solid var(--color-row-divider)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="font-serif italic" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)', lineHeight: 'var(--leading-tight)' }}>
                  {f.fragranceName}
                </div>
                <div className="font-sans uppercase" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', letterSpacing: 'var(--tracking-md)' }}>
                  {f.fragranceHouse}
                </div>
              </div>
            ))}
            {results.length === 0 && query.trim().length > 0 && (
              <div
                className="flex items-center font-sans italic"
                style={{ height: 'var(--space-12)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-meta-text)', borderBottom: '1px solid var(--color-row-divider)' }}
              >
                No matches found
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--color-row-divider)' }}>
              <div
                onMouseDown={() => { setOpen(false); router.push('/import'); }}
                className="flex flex-col justify-center cursor-pointer transition-colors"
                style={{ height: 'var(--space-12)', padding: '0 var(--space-3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="font-serif italic" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)', lineHeight: 'var(--leading-tight)' }}>
                  Import new fragrance
                </div>
                <div className="font-sans uppercase" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: 'var(--tracking-md)' }}>
                  Add to database
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
