"use client";

import { useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { Select } from '@/components/ui/select';

// ── Token manifest ─────────────────────────────────────────
// Covers: Compliments page · Topbar · Sidebar · Login page.
// Add a token here → it appears in the design system.
// Remove it → it disappears. Do not list tokens not used on these surfaces.

interface Location { component: string; detail: string }
interface ColorToken { token: string; label: string; usage: string; locations: Location[] }
interface TypeToken { token: string; label: string; role: string; font: string; italic: boolean; locations: Location[] }
interface SpaceToken { token: string; locations: Location[] }
interface LayoutToken { token: string; label: string; usage: string; locations: Location[] }

const BRAND_COLORS: ColorToken[] = [
  {
    token: '--color-navy', label: 'Navy',
    usage: 'Sidebar bg, login bg, primary text, empty-state icon',
    locations: [
      { component: 'Sidebar.tsx', detail: 'full-width background, left-border on active nav item' },
      { component: 'Login page (app/page.tsx)', detail: 'full-screen background' },
      { component: 'Compliments row', detail: 'meta text (col 2), date text (col 3)' },
      { component: 'Empty state', detail: 'MessageCircle icon, title, description' },
      { component: 'FragranceCell', detail: 'fragrance name, house label' },
    ],
  },
  {
    token: '--color-navy-mid', label: 'Navy Mid',
    usage: 'Topbar app label, find-fragrance search placeholder',
    locations: [
      { component: 'Topbar.tsx', detail: '"TĘSKNOTA" app label above page title' },
      { component: 'DbFragSearch (compliments)', detail: 'search input placeholder text' },
      { component: 'Design system page', detail: 'section headers, row labels, note text' },
    ],
  },
  {
    token: '--color-cream', label: 'Cream',
    usage: 'Topbar bg, page bg, search input bg, login button bg',
    locations: [
      { component: 'Topbar.tsx', detail: 'background color' },
      { component: 'All pages', detail: 'page content background via PageContent' },
      { component: 'DbFragSearch (compliments)', detail: 'search input background' },
      { component: 'Login page', detail: 'user picker button text color' },
    ],
  },
  {
    token: '--color-sand', label: 'Sand',
    usage: 'Sidebar IPA tagline, login "Who are you?" label',
    locations: [
      { component: 'Sidebar.tsx', detail: 'IPA phonetic tagline "[tɛsk-ˈnɔ-ta]"' },
      { component: 'Login page', detail: '"Who are you?" label above user picker' },
    ],
  },
  {
    token: '--color-sand-light', label: 'Sand Light',
    usage: 'Topbar bottom border',
    locations: [
      { component: 'Topbar.tsx', detail: 'bottom border line' },
      { component: 'Design system page', detail: 'color swatch border, section dividers' },
    ],
  },
  {
    token: '--color-live', label: 'Live',
    usage: 'New-activity dot on sidebar nav items',
    locations: [
      { component: 'Sidebar.tsx', detail: 'small dot indicator on nav items with new activity' },
    ],
  },
];

const OPACITY_COLORS: ColorToken[] = [
  {
    token: '--color-white-subtle', label: 'White Subtle',
    usage: 'Sidebar active nav bg; topbar search input bg (navy context)',
    locations: [
      { component: 'Sidebar.tsx', detail: 'background of active nav item' },
      { component: 'Topbar.tsx', detail: 'search input background (navy topbar variant)' },
      { component: 'Login page', detail: 'user picker button border' },
    ],
  },
  {
    token: '--color-white-dim', label: 'White Dim',
    usage: 'Topbar search border',
    locations: [
      { component: 'Topbar.tsx', detail: 'search input border (default state)' },
    ],
  },
  {
    token: '--color-white-mid', label: 'White Mid',
    usage: 'Topbar search focus border',
    locations: [
      { component: 'Topbar.tsx', detail: 'search input border on focus' },
    ],
  },
  {
    token: '--color-cream-muted', label: 'Cream Muted',
    usage: 'Sidebar "Fragrance Tracker" tagline',
    locations: [
      { component: 'Sidebar.tsx', detail: '"FRAGRANCE TRACKER" uppercase tagline below logotype' },
    ],
  },
  {
    token: '--color-cream-faint', label: 'Cream Faint',
    usage: 'Topbar search placeholder text and icon',
    locations: [
      { component: 'Topbar.tsx', detail: 'search icon and placeholder text in navy context' },
    ],
  },
  {
    token: '--color-sand-label', label: 'Sand Label',
    usage: 'Sidebar section header labels (MY SPACE etc.)',
    locations: [
      { component: 'Sidebar.tsx', detail: 'uppercase section headers: "MY SPACE", "DISCOVER"' },
    ],
  },
  {
    token: '--color-sand-muted', label: 'Sand Muted',
    usage: 'Sidebar inactive nav items, Sign Out button',
    locations: [
      { component: 'Sidebar.tsx', detail: 'inactive nav item text and icon' },
      { component: 'Sidebar.tsx', detail: '"Sign Out" label at bottom' },
    ],
  },
  {
    token: '--color-navy-backdrop', label: 'Navy Backdrop',
    usage: 'Mobile sidebar overlay scrim (Sidebar.tsx)',
    locations: [
      { component: 'Sidebar.tsx', detail: 'semi-transparent overlay behind open mobile sidebar' },
    ],
  },
];

const ROW_COLORS: ColorToken[] = [
  {
    token: '--color-row-divider', label: 'Row Divider',
    usage: 'border-bottom on every compliment row',
    locations: [
      { component: 'Compliments page', detail: 'border-bottom on every list row' },
      { component: 'DbFragSearch dropdown', detail: 'divider between search results and import footer' },
      { component: 'FragranceProfileModal', detail: 'section dividers inside modal' },
    ],
  },
  {
    token: '--color-row-hover', label: 'Row Hover',
    usage: 'Hover bg on rows, find-fragrance results, skeleton',
    locations: [
      { component: 'Compliments page', detail: 'row background on mouseenter' },
      { component: 'DbFragSearch dropdown', detail: 'result row background on mouseenter' },
    ],
  },
  {
    token: '--color-meta-text', label: 'Meta Text',
    usage: 'Relation · gender · location meta; compliment notes; input borders',
    locations: [
      { component: 'Compliments row (col 2)', detail: 'notes / quote text (--text-note serif italic)' },
      { component: 'Compliments row (col 2)', detail: 'NOT the meta line — that uses --color-navy' },
      { component: 'DbFragSearch', detail: 'search icon color, input border, "No matches found" text' },
      { component: 'FragranceProfileModal', detail: 'community stat labels and secondary info' },
    ],
  },
];

const TYPE_TOKENS: TypeToken[] = [
  {
    token: '--text-xxs', label: 'XXS', font: 'sans', italic: false,
    role: 'Sidebar "Fragrance Tracker" tagline',
    locations: [
      { component: 'Sidebar.tsx', detail: '"FRAGRANCE TRACKER" uppercase tagline (letter-spacing 0.22em)' },
      { component: 'Login page', detail: '"FRAGRANCE TRACKER" label below logotype' },
    ],
  },
  {
    token: '--text-xs', label: 'XS', font: 'sans', italic: false,
    role: 'Field labels, topbar app label, sidebar nav, meta, date',
    locations: [
      { component: 'Topbar.tsx', detail: '"TĘSKNOTA" app label (letter-spacing 0.12em)' },
      { component: 'Sidebar.tsx', detail: 'nav item labels, section headers, username, Sign Out' },
      { component: 'Compliments row (col 2)', detail: 'meta line: STRANGER · FEMALE · COFFEE SHOP' },
      { component: 'Compliments row (col 3)', detail: 'date: APR 2025' },
      { component: 'FragranceCell', detail: 'house label (uppercase, 0.1em tracking)' },
      { component: 'Design system page', detail: 'all labels, tokens, notes throughout' },
    ],
  },
  {
    token: '--text-sm', label: 'SM', font: 'sans', italic: false,
    role: 'Dropdowns, find-fragrance search input',
    locations: [
      { component: 'Select component', detail: 'sort dropdown on compliments page' },
      { component: 'DbFragSearch', detail: 'search input text and "No matches found"' },
      { component: 'LogComplimentModal', detail: 'form input text' },
    ],
  },
  {
    token: '--text-ui', label: 'UI', font: 'sans', italic: false,
    role: 'Sidebar username, empty-state description',
    locations: [
      { component: 'Sidebar.tsx', detail: 'username display at bottom' },
      { component: 'Compliments empty state', detail: 'description text below title' },
      { component: 'Login page', detail: '"Who are you?" label' },
    ],
  },
  {
    token: '--text-note', label: 'Note', font: 'serif', italic: true,
    role: 'Compliment notes / quotes',
    locations: [
      { component: 'Compliments row (col 2)', detail: 'notes / quote text (line-height 1.6, --color-notes-text)' },
    ],
  },
  {
    token: '--text-md', label: 'MD', font: 'serif', italic: true,
    role: 'Sidebar IPA phonetic tagline',
    locations: [
      { component: 'Sidebar.tsx', detail: '"[tɛsk-ˈnɔ-ta] · a deep longing" tagline' },
      { component: 'Login page', detail: 'full IPA + definition tagline' },
    ],
  },
  {
    token: '--text-lg', label: 'LG', font: 'serif', italic: true,
    role: 'Fragrance name in FragranceCell and search results',
    locations: [
      { component: 'FragranceCell', detail: 'fragrance name (primary line, col 1 of rows)' },
      { component: 'DbFragSearch dropdown', detail: 'result fragrance name' },
      { component: 'LogComplimentModal', detail: 'fragrance name in search results' },
    ],
  },
  {
    token: '--text-empty-title', label: 'Empty Title', font: 'serif', italic: true,
    role: 'Empty-state title ("No compliments yet")',
    locations: [
      { component: 'Compliments empty state', detail: '"No compliments yet" heading' },
    ],
  },
  {
    token: '--text-page-title', label: 'Page Title', font: 'serif', italic: true,
    role: 'Topbar page title (Compliments)',
    locations: [
      { component: 'Topbar.tsx', detail: 'page title ("Compliments", "My Collection", etc.)' },
      { component: 'Login page', detail: 'user picker button text ("Kiana", "Sylvia")' },
    ],
  },
  {
    token: '--text-logo', label: 'Logo', font: 'serif', italic: true,
    role: 'Sidebar tęsknota logotype',
    locations: [
      { component: 'Sidebar.tsx', detail: '"tęsknota" logotype at top' },
      { component: 'Login page', detail: '"tęsknota" logotype centered' },
    ],
  },
];

const SPACE_TOKENS: SpaceToken[] = [
  {
    token: '--space-1',
    locations: [{ component: 'Various', detail: '4px — tight inline gap, small vertical nudge' }],
  },
  {
    token: '--space-4',
    locations: [
      { component: 'Compliments row', detail: 'padding-y on each row' },
      { component: 'Topbar', detail: 'gap between action buttons' },
    ],
  },
  {
    token: '--space-5',
    locations: [{ component: 'Sidebar', detail: 'horizontal padding for nav items and footer' }],
  },
  {
    token: '--space-6',
    locations: [
      { component: 'PageContent', detail: 'padding-y (desktop)' },
      { component: 'Compliments row', detail: 'column gap between col 1 / col 2 / col 3' },
    ],
  },
  {
    token: '--space-8',
    locations: [{ component: 'Sidebar', detail: 'top padding above logotype' }],
  },
  {
    token: '--space-10',
    locations: [{ component: 'Sidebar nav items', detail: 'height of each nav row' }],
  },
];

const LAYOUT_TOKENS: LayoutToken[] = [
  {
    token: '--sidebar-width', label: 'Sidebar Width', usage: 'Fixed sidebar width',
    locations: [{ component: 'Sidebar.tsx', detail: 'fixed width applied to sidebar container' }],
  },
  {
    token: '--header-height', label: 'Header Height', usage: 'Topbar height',
    locations: [{ component: 'Topbar.tsx', detail: 'height of topbar container' }],
  },
  {
    token: '--topbar-px', label: 'Topbar PX', usage: 'Topbar horizontal padding (desktop)',
    locations: [
      { component: 'Topbar.tsx', detail: 'left + right padding on desktop' },
      { component: 'PageContent', detail: 'aliased as --page-margin for page content alignment' },
    ],
  },
  {
    token: '--topbar-px-mobile', label: 'Topbar PX Mobile', usage: 'Topbar horizontal padding (mobile)',
    locations: [
      { component: 'Topbar.tsx', detail: 'left + right padding on mobile (< md breakpoint)' },
      { component: 'PageContent', detail: 'page content left/right padding on mobile' },
    ],
  },
  {
    token: '--page-margin', label: 'Page Margin', usage: 'PageContent horizontal padding — alias of --topbar-px',
    locations: [{ component: 'PageContent.tsx', detail: 'px-[var(--page-margin)] — keeps content aligned with topbar' }],
  },
];

// ── Dynamic token reader ───────────────────────────────────

function useComputedTokens(tokens: string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const result: Record<string, string> = {};
    for (const t of tokens) {
      result[t] = style.getPropertyValue(t).trim();
    }
    setValues(result);
  }, []);
  return values;
}

// ── Hardcode checker ───────────────────────────────────────

interface Violation { tag: string; text: string }

function HardcodeChecker({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const id = requestAnimationFrame(() => {
      const found: Violation[] = [];
      root.querySelectorAll('[style]').forEach((el) => {
        if (el.closest('[data-hardcode-banner]')) return;
        const style = el.getAttribute('style') ?? '';
        const tag = `<${el.tagName.toLowerCase()}>`;
        const hexes = style.match(/#[0-9a-fA-F]{3,8}/g);
        if (hexes) found.push({ tag, text: `raw hex: ${hexes.join(', ')}` });
        const rgbas = style.match(/rgba?\([^)]+\)/g);
        if (rgbas) found.push({ tag, text: `raw rgba/rgb: ${rgbas.join(', ')}` });
        const fontPx = style.match(/font-size\s*:\s*\d+(?:\.\d+)?px/g);
        if (fontPx) found.push({ tag, text: `raw font-size: ${fontPx.join(', ')}` });
      });
      setViolations(found);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const clean = violations.length === 0;
  return (
    <div ref={wrapperRef}>
      <div
        data-hardcode-banner
        style={{
          marginBottom: 'var(--space-6)',
          border: `1px solid ${clean ? 'var(--color-sand-light)' : 'var(--color-meta-text)'}`,
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => violations.length > 0 && setExpanded((v) => !v)}
          className="w-full flex items-center justify-between font-sans font-normal uppercase text-left"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.08em',
            background: clean ? 'var(--color-cream)' : 'var(--color-navy)',
            color: clean ? 'var(--color-navy)' : 'var(--color-cream)',
            border: 'none',
            cursor: violations.length > 0 ? 'pointer' : 'default',
          }}
        >
          <span>
            {clean
              ? 'Design system audit — no hardcoded values detected'
              : `${violations.length} hardcoded value${violations.length !== 1 ? 's' : ''} detected — click to expand`}
          </span>
          {violations.length > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>
          )}
        </button>
        {!clean && expanded && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-cream)' }}>
            <div className="font-sans mb-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
              Replace each with the appropriate <code className="font-mono">var(--*)</code> token.
            </div>
            <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
              {violations.map((v, i) => (
                <div key={i} className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>
                  {v.tag} — {v.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Expanded detail panel ──────────────────────────────────

function TokenDetail({ token, computed, locations, onClose }: {
  token: string;
  computed: string;
  locations: Location[];
  onClose: () => void;
}) {
  return (
    <div
      data-token-detail
      style={{
        margin: 'var(--space-2) 0 var(--space-4)',
        background: 'var(--color-navy)',
        borderRadius: '3px',
        padding: 'var(--space-4)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <code className="font-mono font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-cream)', letterSpacing: '0.04em' }}>{token}</code>
          {computed && (
            <span className="font-mono ml-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)' }}>{computed}</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="font-sans flex-shrink-0"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          ✕ close
        </button>
      </div>
      <div className="font-sans uppercase mb-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-label)', letterSpacing: '0.08em' }}>
        Used in
      </div>
      <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
        {locations.map((loc, i) => (
          <div key={i} className="flex items-baseline gap-3 flex-wrap">
            <span className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-cream)', minWidth: '220px' }}>{loc.component}</span>
            <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)' }}>{loc.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div
        className="font-sans font-normal uppercase mb-4"
        style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-navy-mid)', borderBottom: '1px solid var(--color-row-divider)', paddingBottom: 'var(--space-2)' }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 mb-3">
      <div className="font-sans flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', minWidth: '180px', paddingTop: 'var(--space-1)', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans mt-1 mb-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
      {children}
    </div>
  );
}

function ColorSwatch({
  token, label, usage, computed, expanded, onToggle,
}: {
  token: string; label: string; usage: string; computed: string;
  expanded: boolean; onToggle: () => void;
}) {
  return (
    <div className="mb-1">
      <button
        data-token-row={token}
        onClick={onToggle}
        className="w-full text-left flex items-center gap-3 rounded-[2px] transition-colors"
        style={{
          padding: 'var(--space-2)',
          background: expanded ? 'var(--color-row-hover)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          marginLeft: 'calc(-1 * var(--space-2))',
          width: 'calc(100% + var(--space-4))',
        }}
      >
        <div
          className="flex-shrink-0 rounded-[2px] border border-[var(--color-sand-light)]"
          style={{ width: 'var(--space-8)', height: 'var(--space-8)', background: `var(${token})` }}
        />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-sans font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{label}</span>
            <code className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{token}</code>
            {computed && <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{computed}</span>}
          </div>
          <div className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', marginTop: 'var(--space-1)' }}>{usage}</div>
        </div>
        <span className="ml-auto flex-shrink-0 font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', opacity: 0.5 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function DesignSystemPage() {
  const allTokens = [
    ...BRAND_COLORS.map((c) => c.token),
    ...OPACITY_COLORS.map((c) => c.token),
    ...ROW_COLORS.map((c) => c.token),
    ...TYPE_TOKENS.map((t) => t.token),
    ...SPACE_TOKENS.map((s) => s.token),
    ...LAYOUT_TOKENS.map((t) => t.token),
  ];
  const computed = useComputedTokens(allTokens);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!expandedToken) return;
      const target = e.target as Element;
      if (
        target.closest('[data-token-row]') ||
        target.closest('[data-token-detail]') ||
        target.closest('[data-hardcode-banner]')
      ) return;
      setExpandedToken(null);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [expandedToken]);

  function toggle(token: string) {
    setExpandedToken((prev) => (prev === token ? null : token));
  }

  function detail(token: string, locations: Location[]) {
    if (expandedToken !== token) return null;
    return (
      <TokenDetail
        token={token}
        computed={computed[token] ?? ''}
        locations={locations}
        onClose={() => setExpandedToken(null)}
      />
    );
  }

  return (
    <>
      <Topbar title="Design System" />
      <PageContent maxWidth="920px">
        <div ref={pageRef}>
          <HardcodeChecker>

            {/* ── Brand Colors ── */}
            <Section title="Brand Colors">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {BRAND_COLORS.map((c) => (
                  <div key={c.token}>
                    <ColorSwatch {...c} computed={computed[c.token] ?? ''} expanded={expandedToken === c.token} onToggle={() => toggle(c.token)} />
                    {detail(c.token, c.locations)}
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Opacity Variants ── */}
            <Section title="Opacity Variants">
              <Note>Used on navy backgrounds (sidebar, login page, topbar search).</Note>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {OPACITY_COLORS.map((c) => (
                  <div key={c.token}>
                    <ColorSwatch {...c} computed={computed[c.token] ?? ''} expanded={expandedToken === c.token} onToggle={() => toggle(c.token)} />
                    {detail(c.token, c.locations)}
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Row / List Tokens ── */}
            <Section title="Row / List Tokens">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
                {ROW_COLORS.map((c) => (
                  <div key={c.token}>
                    <ColorSwatch {...c} computed={computed[c.token] ?? ''} expanded={expandedToken === c.token} onToggle={() => toggle(c.token)} />
                    {detail(c.token, c.locations)}
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Type Scale ── */}
            <Section title="Type Scale">
              <Note>
                Two fonts: <strong>Cormorant Garamond</strong> (serif, always italic) · <strong>Inter</strong> (sans, always upright). Never swap.
              </Note>
              <div style={{ marginTop: 'var(--space-4)' }}>
                {TYPE_TOKENS.map(({ token, label, role, font, italic, locations }) => (
                  <div key={token}>
                    <button
                      data-token-row={token}
                      onClick={() => toggle(token)}
                      className="w-full text-left flex items-baseline gap-4 flex-wrap transition-colors rounded-[2px]"
                      style={{
                        borderBottom: expandedToken === token ? 'none' : '1px solid var(--color-row-divider)',
                        padding: 'var(--space-2) var(--space-2)',
                        marginLeft: 'calc(-1 * var(--space-2))',
                        width: 'calc(100% + var(--space-4))',
                        background: expandedToken === token ? 'var(--color-row-hover)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        className={font === 'serif' ? 'font-serif italic' : 'font-sans'}
                        style={{ fontSize: `var(${token})`, color: 'var(--color-navy)', lineHeight: 1.4, minWidth: '200px' }}
                      >
                        {font === 'serif' ? 'Tęsknota — longing' : 'MAISON MARGIELA · APR'}
                      </span>
                      <div className="flex items-baseline gap-2 flex-wrap flex-1">
                        <code className="font-mono font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{token}</code>
                        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{computed[token] ?? '…'}</span>
                        <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{label} · {role}</span>
                      </div>
                      <span className="flex-shrink-0 font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', opacity: 0.5 }}>
                        {expandedToken === token ? '▲' : '▼'}
                      </span>
                    </button>
                    {expandedToken === token && (
                      <div style={{ borderBottom: '1px solid var(--color-row-divider)' }}>
                        {detail(token, locations)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Spacing ── */}
            <Section title="Spacing (4px grid)">
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                {SPACE_TOKENS.map(({ token, locations }) => {
                  const val = computed[token] ?? '';
                  const px = parseInt(val) || 0;
                  const isExpanded = expandedToken === token;
                  return (
                    <div key={token}>
                      <button
                        data-token-row={token}
                        onClick={() => toggle(token)}
                        className="w-full text-left flex items-center gap-4 rounded-[2px] transition-colors"
                        style={{
                          padding: 'var(--space-2)',
                          marginLeft: 'calc(-1 * var(--space-2))',
                          width: 'calc(100% + var(--space-4))',
                          background: isExpanded ? 'var(--color-row-hover)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <code className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '80px' }}>{token}</code>
                        <span className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', minWidth: '40px' }}>{val}</span>
                        <div
                          className="rounded-[2px] flex-shrink-0"
                          style={{ width: `${px}px`, height: 'var(--space-3)', background: 'var(--color-navy)', opacity: 0.3 }}
                        />
                        <span className="ml-auto font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', opacity: 0.5 }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>
                      {detail(token, locations)}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Layout Tokens ── */}
            <Section title="Layout Tokens">
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                {LAYOUT_TOKENS.map(({ token, label, usage, locations }) => {
                  const isExpanded = expandedToken === token;
                  return (
                    <div key={token}>
                      <button
                        data-token-row={token}
                        onClick={() => toggle(token)}
                        className="w-full text-left flex items-baseline gap-4 flex-wrap rounded-[2px] transition-colors"
                        style={{
                          padding: 'var(--space-2)',
                          marginLeft: 'calc(-1 * var(--space-2))',
                          width: 'calc(100% + var(--space-4))',
                          background: isExpanded ? 'var(--color-row-hover)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <code className="font-mono font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '180px' }}>{token}</code>
                        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', minWidth: '60px' }}>{computed[token] ?? '…'}</span>
                        <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{label} · {usage}</span>
                        <span className="ml-auto font-sans flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', opacity: 0.5 }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>
                      {detail(token, locations)}
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* ── Fragrance Cell ── */}
            <Section title="Fragrance Cell — fragrance-cell.tsx">
              <Note>Col 1 on every compliment row. Shows fragrance name (--text-lg serif italic), house (--text-xs sans uppercase), type badge.</Note>
              <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
                <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" secondary="Baccarat Rouge 540" />
              </div>
              <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
                <FragranceCell name="Oud Wood" house="Tom Ford" type="Eau de Parfum" />
              </div>
            </Section>

            {/* ── Buttons ── */}
            <Section title="Buttons — button.tsx">
              <Note>Used on compliments page: primary (Log Compliment), secondary (Find Fragrances).</Note>
              <Row label="variant=primary">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button variant="primary">Log Compliment</Button>
                  <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>navy bg · cream text · --text-sm · 0.08em · 3px radius</span>
                </div>
              </Row>
              <Row label="variant=secondary">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button variant="secondary">Find Fragrances</Button>
                  <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>cream-dark bg · navy text</span>
                </div>
              </Row>
            </Section>

            {/* ── Filter Pills ── */}
            <Section title="Filter Pills — tab-pill.tsx">
              <Note>Relation tabs on compliments page. Active = navy bg, cream text. Inactive = cream-dark bg, navy-mid text.</Note>
              <div className="flex flex-wrap gap-2">
                <TabPill label="All" count={12} active={true} onClick={() => {}} />
                <TabPill label="Strangers" count={4} active={false} onClick={() => {}} />
                <TabPill label="Friends" count={3} active={false} onClick={() => {}} />
                <TabPill label="Colleagues" count={2} active={false} onClick={() => {}} />
              </div>
            </Section>

            {/* ── Select ── */}
            <Section title="Select / Dropdown — select.tsx">
              <Note>
                Sort dropdown on compliments page uses <code className="font-mono">size="auto"</code> — auto-sizes to longest option, never wraps.
              </Note>
              <Row label='size="auto" (sort)'>
                <Select
                  options={[
                    { value: 'a', label: 'Date — Newest first' },
                    { value: 'b', label: 'Date — Oldest first' },
                    { value: 'c', label: 'Fragrance A–Z' },
                  ]}
                  value="a"
                  onChange={() => {}}
                  size="auto"
                />
              </Row>
              <Row label='size="full" (form)'>
                <div style={{ maxWidth: '220px' }}>
                  <Select
                    options={[
                      { value: 'a', label: 'Eau de Parfum' },
                      { value: 'b', label: 'Eau de Toilette' },
                      { value: 'c', label: 'Parfum' },
                    ]}
                    value="a"
                    onChange={() => {}}
                  />
                </div>
              </Row>
            </Section>

            {/* ── Row List — Compliments ── */}
            <Section title="Row List — Compliments page">
              <Note>CSS grid: <code className="font-mono">max-content minmax(0,1fr) auto</code> · col-gap --space-6 · each row subgrid. Click row → edit modal.</Note>
              <div style={{ display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr) auto', columnGap: 'var(--space-6)' }}>
                {[
                  { frag: 'Replica — Coffee Breeze', house: 'Maison Margiela', meta: 'STRANGER · FEMALE · COFFEE SHOP', notes: 'stopped mid-sentence to ask what I was wearing', date: 'APR 2025' },
                  { frag: 'Oud Wood', house: 'Tom Ford', meta: 'COLLEAGUE · MALE · OFFICE', notes: '', date: 'JAN 2025' },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{ display: 'grid', gridTemplateColumns: 'subgrid', gridColumn: '1 / -1', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--color-row-divider)', alignItems: 'start' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-row-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ whiteSpace: 'nowrap' }}>
                      <FragranceCell name={row.frag} house={row.house} type="Eau de Parfum" />
                    </div>
                    <div>
                      <div className="font-sans uppercase mb-1" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-navy)', fontWeight: 400 }}>{row.meta}</div>
                      {row.notes && <div className="font-serif italic" style={{ fontSize: 'var(--text-note)', color: 'var(--color-meta-text)', lineHeight: 1.6 }}>{row.notes}</div>}
                    </div>
                    <div className="font-sans uppercase text-right" style={{ whiteSpace: 'nowrap', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-navy)' }}>{row.date}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* ── Sidebar ── */}
            <Section title="Sidebar — Sidebar.tsx">
              <Note>var(--sidebar-width) · navy bg · fixed on mobile (with nav-backdrop overlay), relative on desktop.</Note>
              <div className="rounded-[3px] overflow-hidden" style={{ maxWidth: 'var(--sidebar-width)', background: 'var(--color-navy)' }}>
                <div style={{ padding: 'var(--space-8) var(--space-5) var(--space-6)' }}>
                  <div className="font-serif italic" style={{ fontSize: 'var(--text-logo)', color: 'var(--color-cream)', lineHeight: 1 }}>tęsknota</div>
                  <div className="font-sans font-medium uppercase mt-1" style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-cream-muted)', letterSpacing: '0.22em' }}>Fragrance Tracker</div>
                  <div className="font-serif italic mt-2" style={{ fontSize: 'var(--text-md)', color: 'var(--color-sand)', lineHeight: 1.5 }}>[tɛsk-ˈnɔ-ta] · a deep longing</div>
                </div>
                <div>
                  <div className="px-5 mb-1 font-sans font-normal uppercase" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-label)', letterSpacing: '0.08em' }}>MY SPACE</div>
                  {[
                    { label: 'Dashboard', active: false },
                    { label: 'My Collection', active: true },
                    { label: 'Compliments', active: false, count: 14 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center font-sans"
                      style={{ height: 'var(--space-10)', paddingLeft: 'var(--space-5)', paddingRight: 'var(--space-5)', borderLeft: item.active ? '3px solid var(--color-cream)' : '3px solid transparent', background: item.active ? 'var(--color-white-subtle)' : 'transparent', color: item.active ? 'var(--color-cream)' : 'var(--color-sand-muted)', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {'count' in item && item.count !== undefined && (
                        <span className="font-sans tabular-nums ml-auto" style={{ fontSize: 'var(--text-xs)', color: item.active ? 'var(--color-cream)' : 'var(--color-sand-muted)' }}>{item.count}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-5 border-t" style={{ borderColor: 'var(--color-white-subtle)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
                  <div className="font-sans mb-1" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-cream)' }}>Kiana</div>
                  <div className="font-sans font-normal uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-sand-muted)' }}>Sign Out</div>
                </div>
              </div>
            </Section>

            {/* ── Topbar ── */}
            <Section title="Topbar — Topbar.tsx">
              <Note>Required on every page. h = --header-height · px = --topbar-px (mobile: --topbar-px-mobile) · cream bg · sand-light border-bottom.</Note>
              <div className="rounded-[3px] overflow-hidden" style={{ background: 'var(--color-cream)', border: '1px solid var(--color-sand-light)' }}>
                <div className="flex items-center gap-3" style={{ height: 'var(--header-height)', paddingLeft: 'var(--topbar-px)', paddingRight: 'var(--topbar-px)' }}>
                  <div className="flex-1">
                    <div className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--color-navy-mid)' }}>TĘSKNOTA</div>
                    <div className="font-serif italic" style={{ fontSize: 'var(--text-page-title)', color: 'var(--color-navy)', lineHeight: 1.2 }}>Compliments</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">Find Fragrances</Button>
                    <Button variant="primary" size="sm">Log Compliment</Button>
                  </div>
                </div>
              </div>
            </Section>

            {/* ── Login Page ── */}
            <Section title="Login Page — app/page.tsx">
              <Note>Full-screen navy bg. Logo uses --text-logo. IPA tagline uses --text-md. User picker buttons use --color-white-subtle bg, --color-white-dim border.</Note>
              <div className="rounded-[3px] overflow-hidden flex flex-col items-center justify-center py-12" style={{ background: 'var(--color-navy)' }}>
                <div className="text-center mb-8">
                  <div className="font-serif italic leading-none" style={{ fontSize: 'var(--text-logo)', color: 'var(--color-cream)' }}>tęsknota</div>
                  <div className="font-sans font-medium uppercase mt-2" style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-cream-muted)', letterSpacing: '0.22em' }}>Fragrance Tracker</div>
                  <div className="font-serif italic mt-2" style={{ fontSize: 'var(--text-md)', color: 'var(--color-sand)', lineHeight: 1.5 }}>[tɛsk-ˈnɔ-ta] · a deep longing for what is absent or past</div>
                </div>
                <div className="font-sans text-center mb-4" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-sand)' }}>Who are you?</div>
                <div className="flex gap-3">
                  {['Kiana', 'Sylvia'].map((name) => (
                    <button
                      key={name}
                      className="font-serif italic rounded-[3px] cursor-pointer"
                      style={{ width: '160px', height: 'var(--space-12)', fontSize: 'var(--text-page-title)', color: 'var(--color-cream)', background: 'var(--color-white-subtle)', border: '1px solid var(--color-white-dim)' }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

          </HardcodeChecker>
        </div>
      </PageContent>
    </>
  );
}
