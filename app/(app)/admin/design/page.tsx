"use client";

import { useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { FieldLabel, OptionalTag, RequiredMark } from '@/components/ui/field-label';
import { Select } from '@/components/ui/select';

// ── Hardcode checker ───────────────────────────────────────
// Scans all inline styles in its children for raw hex colors,
// raw rgba(), or raw px font-size values. Flags them in a
// collapsible banner at the top of the page.

interface Violation {
  tag: string;
  text: string;
}

function HardcodeChecker({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;

    // Run after paint so children are fully rendered
    const id = requestAnimationFrame(() => {
      const found: Violation[] = [];
      root.querySelectorAll('[style]').forEach((el) => {
        // Skip the checker banner itself
        if (el.closest('[data-hardcode-banner]')) return;

        const style = el.getAttribute('style') ?? '';
        const tag = `<${el.tagName.toLowerCase()}>`;

        const hexes = style.match(/#[0-9a-fA-F]{3,8}/g);
        if (hexes) found.push({ tag, text: `raw hex color: ${hexes.join(', ')}` });

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
      {/* Banner — always visible; expandable when violations exist */}
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
          onClick={() => setExpanded((v) => !v)}
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
              : `${violations.length} hardcoded value${violations.length > 1 ? 's' : ''} detected — click to expand`}
          </span>
          {violations.length > 0 && (
            <span style={{ fontSize: 'var(--text-xs)', opacity: 0.8 }}>{expanded ? '▲' : '▼'}</span>
          )}
        </button>

        {!clean && expanded && (
          <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-cream)' }}>
            <div
              className="font-sans mb-2"
              style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}
            >
              The following inline styles bypass the design token system. Replace each with the appropriate{' '}
              <code className="font-mono">var(--*)</code> token.
            </div>
            <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
              {violations.map((v, i) => (
                <div
                  key={i}
                  className="font-mono"
                  style={{ fontSize: 'var(--text-label)', color: 'var(--color-destructive)' }}
                >
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
        style={{
          fontSize: 'var(--text-label)',
          letterSpacing: '0.12em',
          color: 'var(--color-navy-mid)',
          borderBottom: '1px solid var(--color-cream-dark)',
          paddingBottom: 'var(--space-2)',
        }}
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
      <div
        className="font-sans"
        style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', minWidth: '160px', paddingTop: 'var(--space-1)', letterSpacing: '0.04em' }}
      >
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Swatch({ color, label, token }: { color: string; label: string; token: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="flex-shrink-0 rounded-[2px] border border-[var(--color-row-divider)]"
        style={{ width: 'var(--space-8)', height: 'var(--space-8)', background: color }}
      />
      <div>
        <div className="font-sans font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{label}</div>
        <div className="font-mono" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>{token}</div>
      </div>
    </div>
  );
}

function TypeSpec({ children, spec }: { children: React.ReactNode; spec: string }) {
  return (
    <div className="flex items-baseline gap-6 mb-3">
      <div className="flex-1">{children}</div>
      <div
        className="font-sans text-right flex-shrink-0"
        style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', minWidth: '220px', letterSpacing: '0.04em' }}
      >
        {spec}
      </div>
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

// ── Page ───────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <>
      <Topbar title="Design System" />
      <PageContent maxWidth="860px">
        <HardcodeChecker>

          {/* Colors */}
          <Section title="Color Palette">
            <div className="grid grid-cols-2 gap-x-8 md:grid-cols-3">
              <Swatch color="var(--color-navy)"         label="Navy"         token="--color-navy" />
              <Swatch color="var(--color-navy-mid)"     label="Navy Mid"     token="--color-navy-mid" />
              <Swatch color="var(--color-accent)"       label="Accent"       token="--color-accent" />
              <Swatch color="var(--color-cream)"        label="Cream"        token="--color-cream" />
              <Swatch color="var(--color-cream-dark)"   label="Cream Dark"   token="--color-cream-dark" />
              <Swatch color="var(--color-sand)"         label="Sand"         token="--color-sand" />
              <Swatch color="var(--color-sand-light)"   label="Sand Light"   token="--color-sand-light" />
              <Swatch color="var(--color-destructive)"  label="Destructive"  token="--color-destructive" />
              <Swatch color="var(--color-row-divider)"  label="Row Divider"  token="--color-row-divider" />
              <Swatch color="var(--color-meta-text)"    label="Meta Text"    token="--color-meta-text" />
              <Swatch color="var(--color-notes-text)"   label="Notes Text"   token="--color-notes-text" />
              <Swatch color="var(--color-row-hover)"    label="Row Hover"    token="--color-row-hover" />
            </div>
            <Note>
              Never hardcode hex or rgba. Use <code className="font-mono">var(--color-*)</code> tokens only.
              Opacity variants are tokens: <code className="font-mono">--color-meta-text</code>, <code className="font-mono">--color-notes-text</code>, <code className="font-mono">--color-row-divider</code>, etc.
            </Note>
          </Section>

          {/* Typography */}
          <Section title="Typography">
            <div
              className="font-sans mb-3"
              style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}
            >
              Two fonts only: <strong>Cormorant Garamond</strong> (serif, always italic) and <strong>Inter</strong> (sans, always upright). Never swap their roles.
            </div>
            <TypeSpec spec="Serif italic · var(--text-lg) · 400 · navy">
              <span className="font-serif italic" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-navy)' }}>Fragrance Name</span>
            </TypeSpec>
            <TypeSpec spec="Serif italic · var(--text-note) · 400 · navy">
              <span className="font-serif italic" style={{ fontSize: 'var(--text-note)', color: 'var(--color-navy)' }}>+ Layering Name</span>
            </TypeSpec>
            <TypeSpec spec="Serif italic · var(--text-note) · 400 · --color-notes-text · lh 1.6">
              <span className="font-serif italic" style={{ fontSize: 'var(--text-note)', color: 'var(--color-notes-text)', lineHeight: 1.6 }}>worn to a dinner, first comment within 20 minutes</span>
            </TypeSpec>
            <TypeSpec spec="Serif italic · var(--text-empty-title) · 400 · navy">
              <span className="font-serif italic" style={{ fontSize: 'var(--text-empty-title)', color: 'var(--color-navy)' }}>Log a Compliment</span>
            </TypeSpec>
            <TypeSpec spec="Serif italic · var(--text-page-title) · 400 · navy">
              <span className="font-serif italic" style={{ fontSize: 'var(--text-page-title)', color: 'var(--color-navy)' }}>Compliments</span>
            </TypeSpec>
            <TypeSpec spec="Serif italic · var(--text-logo) · 400 · navy">
              <span className="font-serif italic" style={{ fontSize: 'var(--text-logo)', color: 'var(--color-navy)' }}>tęsknota</span>
            </TypeSpec>
            <div style={{ borderTop: '1px solid var(--color-cream-dark)', margin: 'var(--space-3) 0' }} />
            <TypeSpec spec="Sans uppercase · var(--text-xs) · 400 · 0.1em · navy">
              <span className="font-sans uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.1em', color: 'var(--color-navy)' }}>Maison Margiela</span>
            </TypeSpec>
            <TypeSpec spec="Sans · var(--text-xs) · 400 · --color-meta-text">
              <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>STRANGER · FEMALE · COFFEE SHOP</span>
            </TypeSpec>
            <TypeSpec spec="Sans · var(--text-xs) · 400 · navy">
              <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>APR 2025</span>
            </TypeSpec>
            <TypeSpec spec="Sans · var(--text-base) · 400 · navy">
              <span className="font-sans" style={{ fontSize: 'var(--text-base)', color: 'var(--color-navy)' }}>Body copy text</span>
            </TypeSpec>
            <TypeSpec spec="Sans · var(--text-ui) · 400 · navy">
              <span className="font-sans" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)' }}>Caption text</span>
            </TypeSpec>
            <TypeSpec spec="Sans uppercase · var(--text-label) · 500 · 0.1em · navy">
              <span className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-label)', letterSpacing: '0.1em', color: 'var(--color-navy)' }}>Field Label</span>
            </TypeSpec>
            <TypeSpec spec="Sans uppercase · var(--text-sm) · 500 · 0.08em · navy">
              <span className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-sm)', letterSpacing: '0.08em', color: 'var(--color-navy)' }}>Log Compliment</span>
            </TypeSpec>
            <TypeSpec spec="Sans uppercase · var(--text-xs) · 400 · 0.08em · navy">
              <span className="font-sans uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-navy)' }}>All · Strangers · Friends</span>
            </TypeSpec>
          </Section>

          {/* FragranceCell */}
          <Section title="Fragrance Cell (Column 1 — list rows)">
            <Note>
              Component: <code className="font-mono">{'<FragranceCell>'}</code> from <code className="font-mono">components/ui/fragrance-cell.tsx</code>. Use on every list row.
            </Note>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" secondary="Baccarat Rouge 540" />
            </div>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <FragranceCell name="Oud Wood" house="Tom Ford" type="Eau de Parfum" />
            </div>
          </Section>

          {/* Buttons */}
          <Section title="Buttons">
            <Note>
              Component: <code className="font-mono">{'<Button variant="...">'}</code> from <code className="font-mono">components/ui/button.tsx</code>. Never use bare <code className="font-mono">{'<button>'}</code> with inline styles.
            </Note>
            <Row label="variant=primary">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="primary">Log Compliment</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>navy bg · cream text · var(--text-sm) · 0.08em · 3px radius · min-h 40px</span>
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
                <Button variant="destructive">Delete Compliment</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>destructive red bg · cream text</span>
              </div>
            </Row>
            <Row label="variant=ghost">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="ghost">Ghost</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>transparent bg · navy text</span>
              </div>
            </Row>
          </Section>

          {/* Filter pills */}
          <Section title="Filter Pills (TabPill)">
            <Note>
              Component: <code className="font-mono">{'<TabPill>'}</code> from <code className="font-mono">components/ui/tab-pill.tsx</code>. Used for page filters and toggle groups inside modals.
            </Note>
            <Row label="states">
              <div className="flex flex-wrap gap-2">
                <TabPill label="All" count={12} active={true} onClick={() => {}} />
                <TabPill label="Strangers" count={4} active={false} onClick={() => {}} />
                <TabPill label="Friends" count={3} active={false} onClick={() => {}} />
              </div>
            </Row>
            <Note>Active: navy bg · cream text · 1px solid navy. Inactive: transparent · navy text · 1px solid --color-meta-text. var(--text-xs) sans uppercase 0.08em · var(--space-1) var(--space-3) padding · 2px radius.</Note>
          </Section>

          {/* Dropdowns */}
          <Section title="Dropdowns (Select)">
            <Note>
              Component: <code className="font-mono">{'<Select>'}</code> from <code className="font-mono">components/ui/select.tsx</code>. Never use native <code className="font-mono">{'<select>'}</code>.
              Pass <code className="font-mono">size="auto"</code> for standalone sort/filter dropdowns; default <code className="font-mono">size="full"</code> for form fields.
            </Note>
            <Row label='size="full" (form)'>
              <div style={{ maxWidth: '200px' }}>
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
            <Note>Trigger: h-9 · cream bg · 1px solid --color-meta-text · 3px radius. Dropdown: cream bg · same border · --shadow-md · 36px rows · var(--text-sm) sans navy.</Note>
          </Section>

          {/* Form fields */}
          <Section title="Form Fields (Modal / Add Popup)">
            <Note>
              All add/log/edit flows use <code className="font-mono">Modal + ModalHeader + ModalBody + ModalFooter</code>. Field gap: <code className="font-mono">gap-5</code> (var(--space-5)). Paired fields: <code className="font-mono">grid grid-cols-2 gap-4</code>.
            </Note>
            <Row label="FieldLabel">
              <div className="flex items-center gap-4 flex-wrap">
                <FieldLabel>Fragrance <RequiredMark /></FieldLabel>
                <FieldLabel>Notes <OptionalTag /></FieldLabel>
                <span className="font-sans" style={{ fontSize: 'var(--text-label)', color: 'var(--color-navy-mid)' }}>var(--text-label) sans uppercase 0.1em · RequiredMark --color-destructive · OptionalTag navy-mid</span>
              </div>
            </Row>
            <Row label="text input (empty)">
              <input
                readOnly
                placeholder="Work, friend's house, coffee shop..."
                className="w-full h-9 px-3 rounded-[2px] font-sans outline-none placeholder:text-[var(--color-navy-mid)]"
                style={{
                  maxWidth: '320px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  background: 'var(--color-cream)',
                  border: '1px solid var(--color-meta-text)',
                  color: 'var(--color-meta-text)',
                }}
              />
            </Row>
            <Row label="text input (filled)">
              <input
                readOnly
                value="Café Lento, Brooklyn"
                className="w-full h-9 px-3 rounded-[2px] font-sans outline-none"
                style={{
                  maxWidth: '320px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  background: 'var(--color-cream)',
                  border: '1px solid var(--color-meta-text)',
                  color: 'var(--color-navy)',
                }}
              />
            </Row>
            <Row label="textarea (notes)">
              <textarea
                readOnly
                defaultValue="She stopped mid-sentence to ask what I was wearing."
                rows={2}
                className="w-full p-3 rounded-[2px] font-sans outline-none resize-none placeholder:text-[var(--color-navy-mid)]"
                style={{
                  maxWidth: '320px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  background: 'var(--color-cream)',
                  border: '1px solid var(--color-meta-text)',
                  color: 'var(--color-navy)',
                }}
              />
            </Row>
            <Note>All inputs: h-9 · var(--text-xs) sans · 0.08em · 2px radius · cream bg · --color-meta-text border. Empty: --color-meta-text. Filled: --color-navy. Placeholder: --color-navy-mid.</Note>
          </Section>

          {/* Sidebar preview */}
          <Section title="Left Sidebar">
            <Note>
              Component: <code className="font-mono">{'<Sidebar>'}</code> from <code className="font-mono">components/layout/Sidebar.tsx</code>. var(--sidebar-width) wide, navy background.
            </Note>
            <div className="rounded-[3px] overflow-hidden" style={{ maxWidth: 'var(--sidebar-width)', background: 'var(--color-navy)' }}>
              <div style={{ padding: 'var(--space-8) var(--space-5) var(--space-6)' }}>
                <div className="font-serif italic" style={{ fontSize: 'var(--text-logo)', color: 'var(--color-cream)', lineHeight: 1 }}>tęsknota</div>
                <div className="font-sans font-medium uppercase mt-1" style={{ fontSize: 'var(--text-xxs)', color: 'var(--color-cream-muted)', letterSpacing: '0.22em' }}>Fragrance Tracker</div>
              </div>
              <div className="mt-4">
                <div className="px-5 mb-1 font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-label)', letterSpacing: '0.08em' }}>MY SPACE</div>
                {[
                  { label: 'Dashboard', active: false },
                  { label: 'My Collection', active: true },
                  { label: 'Wishlist', active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center font-sans uppercase"
                    style={{
                      height: 'var(--space-10)',
                      paddingLeft: 'var(--space-5)',
                      paddingRight: 'var(--space-5)',
                      borderLeft: item.active ? '3px solid var(--color-cream)' : '3px solid transparent',
                      background: item.active ? 'var(--color-white-subtle)' : 'transparent',
                      color: item.active ? 'var(--color-cream)' : 'var(--color-sand-muted)',
                      fontSize: 'var(--text-xs)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
              <div className="mt-4 mb-2 px-5 pb-4 border-t" style={{ borderColor: 'var(--color-white-subtle)', paddingTop: 'var(--space-4)' }}>
                <div className="font-sans mb-1" style={{ fontSize: 'var(--text-ui)', color: 'var(--color-cream)' }}>Kiana</div>
                <div className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-sand-muted)' }}>Sign Out</div>
              </div>
            </div>
            <Note>Logo: var(--text-logo) serif italic. Tagline: var(--text-xxs) sans --color-cream-muted 0.22em. Section labels: var(--text-xs) --color-sand-label 0.08em. Nav: var(--text-xs) uppercase --color-sand-muted inactive / cream active. Username: var(--text-ui).</Note>
          </Section>

          {/* Topbar preview */}
          <Section title="Page Header (Topbar)">
            <Note>
              Component: <code className="font-mono">{'<Topbar title="..." />'}</code> from <code className="font-mono">components/layout/Topbar.tsx</code>. Required on every page — pairs with <code className="font-mono">{'<PageContent>'}</code>.
            </Note>
            <div className="rounded-[3px] overflow-hidden" style={{ background: 'var(--color-cream)', border: '1px solid var(--color-sand-light)' }}>
              <div
                className="flex items-center gap-3"
                style={{ height: 'var(--header-height)', paddingLeft: 'var(--topbar-px)', paddingRight: 'var(--topbar-px)' }}
              >
                <div className="flex-1">
                  <div className="font-sans font-medium uppercase" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--color-navy-mid)' }}>TĘSKNOTA</div>
                  <div className="font-serif italic" style={{ fontSize: 'var(--text-page-title)', color: 'var(--color-navy)', lineHeight: 1.2 }}>Compliments</div>
                </div>
              </div>
            </div>
            <Note>Height: var(--header-height) · bg cream · border-bottom 1px --color-sand-light · padding var(--topbar-px-mobile) mobile / var(--topbar-px) desktop. App label: var(--text-xs) sans uppercase 0.12em --color-navy-mid. Page title: var(--text-page-title) serif italic navy.</Note>
          </Section>

          {/* Row list */}
          <Section title="Row List Pattern">
            <Note>
              No <code className="font-mono">{'<table>'}</code>. Flexbox rows with border-bottom. Three columns: FragranceCell (col 1), meta+notes (col 2), date (col 3).
            </Note>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <div className="flex gap-6 items-start">
                <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" />
                <div className="flex-1 min-w-0">
                  <div className="font-sans mb-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>STRANGER · FEMALE · COFFEE SHOP</div>
                  <div className="font-serif italic line-clamp-2" style={{ fontSize: 'var(--text-note)', color: 'var(--color-notes-text)', lineHeight: 1.6 }}>stopped me to ask what I was wearing</div>
                </div>
                <div className="font-sans flex-shrink-0 text-right" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '72px' }}>APR 2025</div>
              </div>
            </div>
            <Note>Row: min-h 80px · var(--space-4) padding · gap-6 · --color-row-divider border · --color-row-hover on hover. Notes: line-clamp-2 in list view.</Note>
          </Section>

        </HardcodeChecker>
      </PageContent>
    </>
  );
}
