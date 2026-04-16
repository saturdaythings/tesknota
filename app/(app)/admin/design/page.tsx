"use client";

import { useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { FieldLabel, OptionalTag, RequiredMark } from '@/components/ui/field-label';
import { Select } from '@/components/ui/select';

// ── Token manifest ─────────────────────────────────────────
// Single source of truth. Add a token here → it appears in the design system.

const BRAND_COLORS = [
  { token: '--color-navy',        label: 'Navy',        usage: 'Primary text, buttons, active states' },
  { token: '--color-navy-mid',    label: 'Navy Mid',    usage: 'Secondary text, muted labels' },
  { token: '--color-accent',      label: 'Accent',      usage: 'Focus rings, open state borders' },
  { token: '--color-accent-light',label: 'Accent Light',usage: 'Lighter accent tint' },
  { token: '--color-cream',       label: 'Cream',       usage: 'Page background, input bg, topbar' },
  { token: '--color-cream-dark',  label: 'Cream Dark',  usage: 'Cards, raised surfaces, hover' },
  { token: '--color-sand',        label: 'Sand',        usage: 'Decorative text, IPA tagline' },
  { token: '--color-sand-light',  label: 'Sand Light',  usage: 'Borders on cream backgrounds' },
  { token: '--color-destructive', label: 'Destructive', usage: 'Delete actions, error text' },
  { token: '--color-success',     label: 'Success',     usage: 'Positive state indicators' },
  { token: '--color-live',        label: 'Live',        usage: 'New-activity dot on nav items' },
];

const OPACITY_COLORS = [
  { token: '--color-white-subtle',  label: 'White Subtle',  usage: 'Active nav bg, topbar search input bg (navy context)' },
  { token: '--color-white-dim',     label: 'White Dim',     usage: 'Topbar search input border' },
  { token: '--color-white-mid',     label: 'White Mid',     usage: 'Topbar search focus border' },
  { token: '--color-cream-muted',   label: 'Cream Muted',   usage: 'Sidebar tagline label' },
  { token: '--color-cream-faint',   label: 'Cream Faint',   usage: 'Topbar search placeholder, icon' },
  { token: '--color-sand-label',    label: 'Sand Label',    usage: 'Sidebar section labels' },
  { token: '--color-sand-muted',    label: 'Sand Muted',    usage: 'Sidebar inactive nav items, sign out' },
  { token: '--color-navy-backdrop', label: 'Navy Backdrop', usage: 'Mobile sidebar overlay (Sidebar.tsx)' },
];

const ROW_COLORS = [
  { token: '--color-row-divider', label: 'Row Divider', usage: 'border-bottom on list rows' },
  { token: '--color-row-hover',   label: 'Row Hover',   usage: 'Hover background on list rows, skeleton' },
  { token: '--color-meta-text',   label: 'Meta Text',   usage: 'Relation · gender · location, borders' },
  { token: '--color-notes-text',  label: 'Notes Text',  usage: 'Compliment notes / quotes' },
];

const STATUS_COLORS = [
  { token: '--color-status-current',  label: 'Current',  usage: 'Collection status badge' },
  { token: '--color-status-want',     label: 'Want',     usage: 'Wishlist status badge' },
  { token: '--color-status-finished', label: 'Finished', usage: 'Finished status badge' },
  { token: '--color-status-sample',   label: 'Sample',   usage: 'Sample status badge' },
  { token: '--color-status-dupe',     label: 'Dupe',     usage: 'Duplicate status badge' },
];

const TYPE_TOKENS = [
  { token: '--text-xxs',        label: 'XXS',         role: 'Sidebar tagline label',              font: 'sans',  italic: false },
  { token: '--text-label',      label: 'Label',       role: 'Field labels, section headers, spec', font: 'sans',  italic: false },
  { token: '--text-xs',         label: 'XS',          role: 'Meta, date, nav items, badges',       font: 'sans',  italic: false },
  { token: '--text-sm',         label: 'SM',          role: 'Dropdowns, buttons, body small',      font: 'sans',  italic: false },
  { token: '--text-ui',         label: 'UI',          role: 'Sidebar username, empty state desc',  font: 'sans',  italic: false },
  { token: '--text-base',       label: 'Base',        role: 'Body copy',                           font: 'sans',  italic: false },
  { token: '--text-note',       label: 'Note',        role: 'Compliment notes, secondary frag',    font: 'serif', italic: true  },
  { token: '--text-md',         label: 'MD',          role: 'Sidebar IPA tagline',                 font: 'serif', italic: true  },
  { token: '--text-lg',         label: 'LG',          role: 'Fragrance name in FragranceCell',     font: 'serif', italic: true  },
  { token: '--text-empty-title',label: 'Empty Title', role: 'Modal titles, empty state titles',    font: 'serif', italic: true  },
  { token: '--text-page-title', label: 'Page Title',  role: 'Topbar page title',                   font: 'serif', italic: true  },
  { token: '--text-xl',         label: 'XL',          role: 'Large display, hero alt',             font: 'serif', italic: true  },
  { token: '--text-logo',       label: 'Logo',        role: 'Sidebar tęsknota logotype',           font: 'serif', italic: true  },
  { token: '--text-2xl',        label: '2XL',         role: 'Large display headings',              font: 'serif', italic: true  },
  { token: '--text-hero',       label: 'Hero',        role: 'Hero / marketing headings',           font: 'serif', italic: true  },
];

const SPACE_TOKENS = [
  '--space-1', '--space-2', '--space-3', '--space-4',
  '--space-5', '--space-6', '--space-8', '--space-10',
  '--space-12', '--space-16',
];

const LAYOUT_TOKENS = [
  { token: '--sidebar-width',     label: 'Sidebar Width',      usage: 'Fixed sidebar width' },
  { token: '--header-height',     label: 'Header Height',      usage: 'Topbar height' },
  { token: '--topbar-px',         label: 'Topbar PX',          usage: 'Topbar horizontal padding (desktop)' },
  { token: '--topbar-px-mobile',  label: 'Topbar PX Mobile',   usage: 'Topbar horizontal padding (mobile)' },
  { token: '--page-margin',       label: 'Page Margin',        usage: 'PageContent horizontal padding — alias of --topbar-px' },
];

// ── Dynamic token reader ───────────────────────────────────
// Reads all CSS custom property values from :root via getComputedStyle.
// Returns the defined value (e.g. "#1E2D45", "rgba(30, 45, 69, 0.5)", "20px").

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
          border: `1px solid ${clean ? 'var(--color-sand-light)' : 'var(--color-destructive)'}`,
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => violations.length > 0 && setExpanded((v) => !v)}
          className="w-full flex items-center justify-between font-sans font-medium uppercase text-left"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            fontSize: 'var(--text-xs)',
            letterSpacing: '0.1em',
            background: clean ? 'var(--color-cream-dark)' : 'var(--color-destructive)',
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
            <div className="font-sans mb-2" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
              Replace each with the appropriate <code className="font-mono">var(--*)</code> token.
            </div>
            <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
              {violations.map((v, i) => (
                <div key={i} className="font-mono" style={{ fontSize: 'var(--text-label)', color: 'var(--color-destructive)' }}>
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

// ── Layout helpers ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div
        className="font-sans font-medium uppercase mb-4"
        style={{ fontSize: 'var(--text-label)', letterSpacing: '0.12em', color: 'var(--color-navy-mid)', borderBottom: '1px solid var(--color-cream-dark)', paddingBottom: 'var(--space-2)' }}
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
      <div className="font-sans flex-shrink-0" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', minWidth: '180px', paddingTop: 'var(--space-1)', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans mt-2" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
      {children}
    </div>
  );
}

// Dynamic color swatch — background from CSS var, computed value shown live
function ColorSwatch({ token, label, usage, computed }: { token: string; label: string; usage: string; computed: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="flex-shrink-0 rounded-[2px] border border-[var(--color-sand-light)]"
        style={{ width: 'var(--space-8)', height: 'var(--space-8)', background: `var(${token})` }}
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{label}</span>
          <code className="font-mono" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>{token}</code>
          {computed && <span className="font-mono" style={{ fontSize: 'var(--text-label)', color: 'var(--color-accent)' }}>{computed}</span>}
        </div>
        <div className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', marginTop: 'var(--space-1)' }}>{usage}</div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function DesignSystemPage() {
  const allTokens = [
    ...BRAND_COLORS.map((c) => c.token),
    ...OPACITY_COLORS.map((c) => c.token),
    ...ROW_COLORS.map((c) => c.token),
    ...STATUS_COLORS.map((c) => c.token),
    ...TYPE_TOKENS.map((t) => t.token),
    ...SPACE_TOKENS,
    ...LAYOUT_TOKENS.map((t) => t.token),
  ];
  const computed = useComputedTokens(allTokens);

  return (
    <>
      <Topbar title="Design System" />
      <PageContent maxWidth="920px">
        <HardcodeChecker>

          {/* ── Brand Colors ── */}
          <Section title="Brand Colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {BRAND_COLORS.map((c) => (
                <ColorSwatch key={c.token} {...c} computed={computed[c.token] ?? ''} />
              ))}
            </div>
          </Section>

          {/* ── Opacity Variants ── */}
          <Section title="Opacity Variants (on dark backgrounds)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {OPACITY_COLORS.map((c) => (
                <ColorSwatch key={c.token} {...c} computed={computed[c.token] ?? ''} />
              ))}
            </div>
          </Section>

          {/* ── Row / List Tokens ── */}
          <Section title="Row / List Tokens">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {ROW_COLORS.map((c) => (
                <ColorSwatch key={c.token} {...c} computed={computed[c.token] ?? ''} />
              ))}
            </div>
          </Section>

          {/* ── Status Colors ── */}
          <Section title="Status Badge Colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {STATUS_COLORS.map((c) => (
                <ColorSwatch key={c.token} {...c} computed={computed[c.token] ?? ''} />
              ))}
            </div>
          </Section>

          {/* ── Type Scale ── */}
          <Section title="Type Scale">
            <Note>
              Two fonts: <strong>Cormorant Garamond</strong> (serif, always italic) · <strong>Inter</strong> (sans, always upright). Never swap.
            </Note>
            <div style={{ marginTop: 'var(--space-4)' }}>
              {TYPE_TOKENS.map(({ token, label, role, font, italic }) => (
                <div
                  key={token}
                  className="flex items-baseline gap-4 flex-wrap"
                  style={{ borderBottom: '1px solid var(--color-cream-dark)', padding: 'var(--space-2) 0' }}
                >
                  <span
                    className={font === 'serif' ? 'font-serif italic' : 'font-sans'}
                    style={{ fontSize: `var(${token})`, color: 'var(--color-navy)', lineHeight: 1.4, minWidth: '200px' }}
                  >
                    {font === 'serif' ? 'Tęsknota — longing' : 'MAISON MARGIELA · APR'}
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <code className="font-mono font-medium" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy)' }}>{token}</code>
                    <span className="font-mono" style={{ fontSize: 'var(--text-label)', color: 'var(--color-accent)' }}>{computed[token] ?? '…'}</span>
                    <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>{label} · {role}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Spacing ── */}
          <Section title="Spacing (4px grid)">
            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
              {SPACE_TOKENS.map((token) => {
                const val = computed[token] ?? '';
                const px = parseInt(val) || 0;
                return (
                  <div key={token} className="flex items-center gap-4">
                    <code className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy)', minWidth: '80px' }}>{token}</code>
                    <span className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-label)', color: 'var(--color-accent)', minWidth: '40px' }}>{val}</span>
                    <div
                      className="rounded-[2px] flex-shrink-0"
                      style={{ width: `${px}px`, height: 'var(--space-3)', background: 'var(--color-navy)', opacity: 0.3 }}
                    />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── Layout Tokens ── */}
          <Section title="Layout Tokens">
            <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
              {LAYOUT_TOKENS.map(({ token, label, usage }) => (
                <div key={token} className="flex items-baseline gap-4 flex-wrap">
                  <code className="font-mono font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '180px' }}>{token}</code>
                  <span className="font-mono" style={{ fontSize: 'var(--text-label)', color: 'var(--color-accent)', minWidth: '60px' }}>{computed[token] ?? '…'}</span>
                  <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>{label} · {usage}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── FragranceCell ── */}
          <Section title="Fragrance Cell — component: fragrance-cell.tsx">
            <Note>Use on every list row (Collection, Wishlist, Compliments).</Note>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" secondary="Baccarat Rouge 540" />
            </div>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <FragranceCell name="Oud Wood" house="Tom Ford" type="Eau de Parfum" />
            </div>
          </Section>

          {/* ── Buttons ── */}
          <Section title="Buttons — component: button.tsx">
            <Note>Never use bare <code className="font-mono">{'<button>'}</code> with inline styles.</Note>
            <Row label="variant=primary">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="primary">Log Compliment</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>navy bg · cream text · --text-sm · 0.08em · 3px radius · min-h 40px</span>
              </div>
            </Row>
            <Row label="variant=secondary">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="secondary">Cancel</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>cream-dark bg · navy text</span>
              </div>
            </Row>
            <Row label="variant=destructive">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="destructive">Delete</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>--color-destructive bg · cream text</span>
              </div>
            </Row>
            <Row label="variant=ghost">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost">Ghost</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>transparent bg · navy text</span>
              </div>
            </Row>
          </Section>

          {/* ── Filter Pills ── */}
          <Section title="Filter Pills — component: tab-pill.tsx">
            <Note>Used for page filters and toggle groups inside modals.</Note>
            <Row label="active / inactive">
              <div className="flex flex-wrap gap-2">
                <TabPill label="All" count={12} active={true} onClick={() => {}} />
                <TabPill label="Strangers" count={4} active={false} onClick={() => {}} />
                <TabPill label="Friends" count={3} active={false} onClick={() => {}} />
                <TabPill label="Colleagues" count={2} active={false} onClick={() => {}} />
              </div>
            </Row>
          </Section>

          {/* ── Select ── */}
          <Section title="Select / Dropdown — component: select.tsx">
            <Note>
              Never use native <code className="font-mono">{'<select>'}</code>.
              Pass <code className="font-mono">size="auto"</code> for standalone sort/filter; default <code className="font-mono">size="full"</code> for form fields.
            </Note>
            <Row label='size="full" (form)'>
              <div style={{ maxWidth: '220px' }}>
                <Select
                  options={[
                    { value: 'a', label: 'Date — Newest first' },
                    { value: 'b', label: 'Date — Oldest first' },
                    { value: 'c', label: 'Fragrance A–Z' },
                  ]}
                  value="a"
                  onChange={() => {}}
                />
              </div>
            </Row>
            <Row label='size="auto" (standalone)'>
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
          </Section>

          {/* ── Form Fields ── */}
          <Section title="Form Fields — inputs, textarea, FieldLabel">
            <Note>
              All add/log/edit flows: <code className="font-mono">Modal + ModalHeader + ModalBody + ModalFooter</code>. Field gap: <code className="font-mono">var(--space-5)</code>. Paired fields: <code className="font-mono">grid grid-cols-2 gap-4</code>.
            </Note>
            <Row label="FieldLabel">
              <div className="flex items-center gap-4 flex-wrap">
                <FieldLabel>Fragrance <RequiredMark /></FieldLabel>
                <FieldLabel>Notes <OptionalTag /></FieldLabel>
              </div>
            </Row>
            <Row label="input empty">
              <input
                readOnly
                placeholder="Work, friend's house, coffee shop..."
                className="w-full h-9 px-3 rounded-[2px] font-sans outline-none placeholder:text-[var(--color-navy-mid)]"
                style={{ maxWidth: '320px', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', background: 'var(--color-cream)', border: '1px solid var(--color-meta-text)', color: 'var(--color-meta-text)' }}
              />
            </Row>
            <Row label="input filled">
              <input
                readOnly
                value="Café Lento, Brooklyn"
                className="w-full h-9 px-3 rounded-[2px] font-sans outline-none"
                style={{ maxWidth: '320px', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', background: 'var(--color-cream)', border: '1px solid var(--color-meta-text)', color: 'var(--color-navy)' }}
              />
            </Row>
            <Row label="textarea">
              <textarea
                readOnly
                defaultValue="She stopped mid-sentence to ask what I was wearing."
                rows={2}
                className="w-full p-3 rounded-[2px] font-sans outline-none resize-none"
                style={{ maxWidth: '320px', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', background: 'var(--color-cream)', border: '1px solid var(--color-meta-text)', color: 'var(--color-navy)' }}
              />
            </Row>
          </Section>

          {/* ── Row List ── */}
          <Section title="Row List Pattern — compliments, collection, wishlist">
            <Note>No tables. Flexbox rows, border-bottom. Three cols: FragranceCell · meta+notes · date.</Note>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <div className="flex gap-6 items-start">
                <div style={{ width: '200px', flexShrink: 0 }}>
                  <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>STRANGER · FEMALE · COFFEE SHOP</div>
                  <div className="font-serif italic line-clamp-2" style={{ fontSize: 'var(--text-note)', color: 'var(--color-notes-text)', lineHeight: 1.6 }}>stopped me to ask what I was wearing</div>
                </div>
                <div className="font-sans flex-shrink-0 text-right" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '72px' }}>APR 2025</div>
              </div>
            </div>
          </Section>

          {/* ── Sidebar Preview ── */}
          <Section title="Sidebar — component: Sidebar.tsx">
            <Note>var(--sidebar-width) wide · navy bg · fixed on mobile, relative on desktop.</Note>
            <div className="rounded-[3px] overflow-hidden" style={{ maxWidth: 'var(--sidebar-width)', background: 'var(--color-navy)' }}>
              <div style={{ padding: 'var(--space-8) var(--space-5) var(--space-6)' }}>
                <div className="font-serif italic" style={{ fontSize: 'var(--text-logo)', color: 'var(--color-cream)', lineHeight: 1 }}>tęsknota</div>
                <div className="font-sans font-medium uppercase mt-1" style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-cream-muted)', letterSpacing: '0.22em' }}>Fragrance Tracker</div>
              </div>
              <div>
                <div className="px-5 mb-1 font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-label)', letterSpacing: '0.08em' }}>MY SPACE</div>
                {[
                  { label: 'Dashboard', active: false },
                  { label: 'My Collection', active: true },
                  { label: 'Wishlist', active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center font-sans uppercase"
                    style={{ height: 'var(--space-10)', paddingLeft: 'var(--space-5)', paddingRight: 'var(--space-5)', borderLeft: item.active ? '3px solid var(--color-cream)' : '3px solid transparent', background: item.active ? 'var(--color-white-subtle)' : 'transparent', color: item.active ? 'var(--color-cream)' : 'var(--color-sand-muted)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em' }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="px-5 border-t" style={{ borderColor: 'var(--color-white-subtle)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
                <div className="font-sans mb-1" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-cream)' }}>Kiana</div>
                <div className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-sand-muted)' }}>Sign Out</div>
              </div>
            </div>
          </Section>

          {/* ── Topbar Preview ── */}
          <Section title="Topbar — component: Topbar.tsx">
            <Note>Required on every page. Always pairs with PageContent.</Note>
            <div className="rounded-[3px] overflow-hidden" style={{ background: 'var(--color-cream)', border: '1px solid var(--color-sand-light)' }}>
              <div
                className="flex items-center gap-3"
                style={{ height: 'var(--header-height)', paddingLeft: 'var(--topbar-px)', paddingRight: 'var(--topbar-px)' }}
              >
                <div className="flex-1">
                  <div className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--color-navy-mid)' }}>TĘSKNOTA</div>
                  <div className="font-serif italic" style={{ fontSize: 'var(--text-page-title)', color: 'var(--color-navy)', lineHeight: 1.2 }}>Compliments</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="secondary" size="sm">Find Fragrances</Button>
                  <Button variant="primary" size="sm">Log Compliment</Button>
                </div>
              </div>
            </div>
          </Section>

        </HardcodeChecker>
      </PageContent>
    </>
  );
}
