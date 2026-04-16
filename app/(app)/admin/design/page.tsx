"use client";

import { useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { Select } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

// ── Token manifests ────────────────────────────────────────
// Covers: Compliments page · Topbar · Sidebar · Login page.
// Add a token here → it appears. Remove → it disappears.
// Do not list tokens not used on these four surfaces.

const BRAND_COLORS = [
  { token: '--color-navy',       label: 'Navy',       usage: 'Sidebar bg, login bg, primary text, empty-state icon' },
  { token: '--color-navy-mid',   label: 'Navy Mid',   usage: 'Topbar app label, find-fragrance search placeholder' },
  { token: '--color-cream',      label: 'Cream',      usage: 'Topbar bg, page bg, search input bg, login button bg' },
  { token: '--color-sand',       label: 'Sand',       usage: 'Sidebar IPA tagline, login "Who are you?" label' },
  { token: '--color-sand-light', label: 'Sand Light', usage: 'Topbar bottom border' },
  { token: '--color-live',       label: 'Live',       usage: 'New-activity dot on sidebar nav items' },
];

const OPACITY_COLORS = [
  { token: '--color-white-subtle',  label: 'White Subtle',  usage: 'Sidebar active nav bg; topbar search input bg' },
  { token: '--color-white-dim',     label: 'White Dim',     usage: 'Topbar search border (default)' },
  { token: '--color-white-mid',     label: 'White Mid',     usage: 'Topbar search border on focus' },
  { token: '--color-cream-muted',   label: 'Cream Muted',   usage: 'Sidebar "Fragrance Tracker" tagline' },
  { token: '--color-cream-faint',   label: 'Cream Faint',   usage: 'Topbar search placeholder text and icon' },
  { token: '--color-sand-label',    label: 'Sand Label',    usage: 'Sidebar section header labels' },
  { token: '--color-sand-muted',    label: 'Sand Muted',    usage: 'Sidebar inactive nav items, Sign Out button' },
  { token: '--color-navy-backdrop', label: 'Navy Backdrop', usage: 'Mobile sidebar overlay scrim' },
];

const ROW_COLORS = [
  { token: '--color-row-divider', label: 'Row Divider', usage: 'border-bottom on every compliment row' },
  { token: '--color-row-hover',   label: 'Row Hover',   usage: 'Row hover background, search result hover, skeleton' },
  { token: '--color-meta-text',   label: 'Meta Text',   usage: 'Compliment notes; search icon/border; "No matches" text' },
];

const TYPE_TOKENS = [
  { token: '--text-xxs',        label: 'XXS',         role: 'Sidebar "Fragrance Tracker" tagline',              font: 'sans',  italic: false },
  { token: '--text-xs',         label: 'XS',          role: 'Field labels, topbar app label, sidebar nav, meta, date', font: 'sans', italic: false },
  { token: '--text-sm',         label: 'SM',          role: 'Dropdowns, find-fragrance search input',           font: 'sans',  italic: false },
  { token: '--text-ui',         label: 'UI',          role: 'Sidebar username, empty-state description',        font: 'sans',  italic: false },
  { token: '--text-note',       label: 'Note',        role: 'Compliment notes / quotes',                        font: 'serif', italic: true  },
  { token: '--text-md',         label: 'MD',          role: 'Sidebar IPA phonetic tagline',                     font: 'serif', italic: true  },
  { token: '--text-lg',         label: 'LG',          role: 'Fragrance name in FragranceCell and search results', font: 'serif', italic: true },
  { token: '--text-empty-title',label: 'Empty Title', role: 'Empty-state title ("No compliments yet")',         font: 'serif', italic: true  },
  { token: '--text-page-title', label: 'Page Title',  role: 'Topbar page title',                                font: 'serif', italic: true  },
  { token: '--text-logo',       label: 'Logo',        role: 'Sidebar tęsknota logotype',                        font: 'serif', italic: true  },
];

const SPACE_TOKENS = ['--space-1', '--space-4', '--space-5', '--space-6', '--space-8', '--space-10'];

const LAYOUT_TOKENS = [
  { token: '--sidebar-width',    label: 'Sidebar Width',    usage: 'Fixed sidebar width' },
  { token: '--header-height',    label: 'Header Height',    usage: 'Topbar height' },
  { token: '--topbar-px',        label: 'Topbar PX',        usage: 'Topbar horizontal padding (desktop)' },
  { token: '--topbar-px-mobile', label: 'Topbar PX Mobile', usage: 'Topbar horizontal padding (mobile)' },
  { token: '--page-margin',      label: 'Page Margin',      usage: 'PageContent horizontal padding — alias of --topbar-px' },
];

// ── Dynamic token reader ───────────────────────────────────

function useComputedTokens(tokens: string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const result: Record<string, string> = {};
    for (const t of tokens) result[t] = style.getPropertyValue(t).trim();
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
        style={{ marginBottom: 'var(--space-6)', border: `1px solid ${clean ? 'var(--color-sand-light)' : 'var(--color-meta-text)'}`, borderRadius: '3px', overflow: 'hidden' }}
      >
        <button
          onClick={() => violations.length > 0 && setExpanded((v) => !v)}
          className="w-full flex items-center justify-between font-sans font-normal uppercase text-left"
          style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', letterSpacing: '0.08em', background: clean ? 'var(--color-cream)' : 'var(--color-navy)', color: clean ? 'var(--color-navy)' : 'var(--color-cream)', border: 'none', cursor: violations.length > 0 ? 'pointer' : 'default' }}
        >
          <span>
            {clean
              ? 'Design system audit — no hardcoded values detected'
              : `${violations.length} hardcoded value${violations.length !== 1 ? 's' : ''} detected — click to expand`}
          </span>
          {violations.length > 0 && <span style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>{expanded ? '▲' : '▼'}</span>}
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

// ── Token editor ───────────────────────────────────────────

function TokenEditPanel({ tokenName, defaultValue, onClose }: { tokenName: string; defaultValue: string; onClose: () => void }) {
  const [committedValue] = useState(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
    // Strip accidental "tokenName: " prefix if a prior corrupted publish baked it into the inline style
    const colonPrefix = tokenName + ':';
    return raw.startsWith(colonPrefix) ? raw.slice(colonPrefix.length).trim() : raw;
  });
  const [draft, setDraft] = useState(committedValue);
  const [publishedValue, setPublishedValue] = useState(committedValue);
  const publishedRef = useRef(committedValue);
  const committedRef = useRef(committedValue);
  const [status, setStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [activeAction, setActiveAction] = useState<'publish' | 'reset' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sha, setSha] = useState('');

  // Apply draft as live preview
  useEffect(() => {
    document.documentElement.style.setProperty(tokenName, draft);
  }, [draft, tokenName]);

  // On unmount: keep published value if a commit landed, else revert to CSS file
  useEffect(() => {
    return () => {
      if (publishedRef.current !== committedRef.current) {
        document.documentElement.style.setProperty(tokenName, publishedRef.current);
      } else {
        document.documentElement.style.removeProperty(tokenName);
      }
    };
  }, [tokenName]);

  const isDirty = draft !== publishedValue;
  const isAtDefault = draft === defaultValue;

  async function callWorker(value: string, message?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setStatus('error');
      setErrorMsg('No active session — sign in again');
      setActiveAction(null);
      return;
    }
    try {
      const body: Record<string, string> = { tokenName, value };
      if (message) body.message = message;
      const res = await fetch('/patch-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed (' + res.status + ')');
      publishedRef.current = value;
      setPublishedValue(value);
      setStatus('success');
      setSha(data.sha ?? '');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Publish failed');
      document.documentElement.style.setProperty(tokenName, publishedRef.current);
      setDraft(publishedRef.current);
    }
    setActiveAction(null);
  }

  async function publish() {
    if (!isDirty || status === 'publishing') return;
    setStatus('publishing');
    setActiveAction('publish');
    setErrorMsg('');
    await callWorker(draft);
  }

  async function resetToDefault() {
    if (isAtDefault || status === 'publishing') return;
    setStatus('publishing');
    setActiveAction('reset');
    setErrorMsg('');
    document.documentElement.style.setProperty(tokenName, defaultValue);
    setDraft(defaultValue);
    await callWorker(defaultValue, 'revert(design): restore ' + tokenName + ' to default');
  }

  return (
    <div className="rounded-[2px]" style={{ background: 'var(--color-navy)', padding: 'var(--space-4)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
      <div className="font-mono mb-2 tracking-[0.04em]" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>{tokenName}</div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); if (status !== 'idle') { setStatus('idle'); setErrorMsg(''); } }}
          spellCheck={false}
          onKeyDown={(e) => { if (e.key === 'Enter') publish(); if (e.key === 'Escape') onClose(); }}
          className="font-mono flex-1 min-w-0 rounded-[2px] outline-none"
          style={{ background: 'var(--color-white-subtle)', border: '1px solid var(--color-white-dim)', color: 'var(--color-cream)', fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-3)' }}
        />
        {!isAtDefault && (
          <button
            onClick={resetToDefault}
            disabled={status === 'publishing'}
            className="font-sans flex-shrink-0 bg-transparent border-0 cursor-pointer p-0 disabled:opacity-50 disabled:cursor-default"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)' }}
          >
            {activeAction === 'reset' ? 'Restoring\u2026' : 'Reset'}
          </button>
        )}
        <button
          onClick={publish}
          disabled={!isDirty || status === 'publishing'}
          className={'font-sans font-medium flex-shrink-0 rounded-[2px] border-0 tracking-[0.08em] disabled:opacity-50 ' + (isDirty ? 'cursor-pointer' : 'cursor-default')}
          style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', background: isDirty ? 'var(--color-cream)' : 'var(--color-white-subtle)', color: isDirty ? 'var(--color-navy)' : 'var(--color-sand-muted)' }}
        >
          {activeAction === 'publish' ? 'Publishing\u2026' : 'Publish'}
        </button>
      </div>
      {status === 'success' && (
        <div className="font-mono mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>
          committed {sha.slice(0, 7)}
        </div>
      )}
      {status === 'error' && (
        <div className="font-sans mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}

function ExpandableToken({ token, defaultValue, expanded, onToggle, children }: { token: string; defaultValue: string; expanded: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div onClick={onToggle} style={{ cursor: 'pointer' }}>{children}</div>
      {expanded && <TokenEditPanel tokenName={token} defaultValue={defaultValue} onClose={onToggle} />}
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="font-sans font-normal uppercase mb-4" style={{ fontSize: 'var(--text-xs)', letterSpacing: '0.08em', color: 'var(--color-navy-mid)', borderBottom: '1px solid var(--color-row-divider)', paddingBottom: 'var(--space-2)' }}>
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

function ColorSwatch({ token, label, usage, computed }: { token: string; label: string; usage: string; computed: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex-shrink-0 rounded-[2px] border border-[var(--color-sand-light)]" style={{ width: 'var(--space-8)', height: 'var(--space-8)', background: `var(${token})` }} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{label}</span>
          <code className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{token}</code>
          {computed && <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{computed}</span>}
        </div>
        <div className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', marginTop: 'var(--space-1)' }}>{usage}</div>
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
    ...TYPE_TOKENS.map((t) => t.token),
    ...SPACE_TOKENS,
    ...LAYOUT_TOKENS.map((t) => t.token),
  ];
  const computed = useComputedTokens(allTokens);
  const [expandedToken, setExpandedToken] = useState<string | null>(null);

  function toggle(token: string) {
    setExpandedToken((prev) => (prev === token ? null : token));
  }

  return (
    <>
      <Topbar title="Design System" />
      <PageContent maxWidth="920px">
        <HardcodeChecker>

          <Section title="Brand Colors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {BRAND_COLORS.map((c) => (
                <ExpandableToken key={c.token} token={c.token} defaultValue={computed[c.token] ?? ''} expanded={expandedToken === c.token} onToggle={() => toggle(c.token)}>
                  <ColorSwatch {...c} computed={computed[c.token] ?? ''} />
                </ExpandableToken>
              ))}
            </div>
          </Section>

          <Section title="Opacity Variants">
            <Note>Used on navy backgrounds — sidebar, login page, topbar search.</Note>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {OPACITY_COLORS.map((c) => (
                <ExpandableToken key={c.token} token={c.token} defaultValue={computed[c.token] ?? ''} expanded={expandedToken === c.token} onToggle={() => toggle(c.token)}>
                  <ColorSwatch {...c} computed={computed[c.token] ?? ''} />
                </ExpandableToken>
              ))}
            </div>
          </Section>

          <Section title="Row / List Tokens">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
              {ROW_COLORS.map((c) => (
                <ExpandableToken key={c.token} token={c.token} defaultValue={computed[c.token] ?? ''} expanded={expandedToken === c.token} onToggle={() => toggle(c.token)}>
                  <ColorSwatch {...c} computed={computed[c.token] ?? ''} />
                </ExpandableToken>
              ))}
            </div>
          </Section>

          <Section title="Type Scale">
            <Note>Cormorant Garamond (serif, always italic) · Inter (sans, always upright). Never swap.</Note>
            <div style={{ marginTop: 'var(--space-4)' }}>
              {TYPE_TOKENS.map(({ token, label, role, font, italic }) => (
                <ExpandableToken key={token} token={token} defaultValue={computed[token] ?? ''} expanded={expandedToken === token} onToggle={() => toggle(token)}>
                  <div className="flex items-baseline gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-2) 0' }}>
                    <span
                      className={font === 'serif' ? 'font-serif italic' : 'font-sans'}
                      style={{ fontSize: `var(${token})`, color: 'var(--color-navy)', lineHeight: 1.4, minWidth: '200px' }}
                    >
                      {font === 'serif' ? 'Tęsknota — longing' : 'MAISON MARGIELA · APR'}
                    </span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <code className="font-mono font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{token}</code>
                      <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{computed[token] ?? '…'}</span>
                      <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{label} · {role}</span>
                    </div>
                  </div>
                </ExpandableToken>
              ))}
            </div>
          </Section>

          <Section title="Spacing (4px grid)">
            <div className="flex flex-col" style={{ gap: 'var(--space-2)' }}>
              {SPACE_TOKENS.map((token) => {
                const val = computed[token] ?? '';
                const px = parseInt(val) || 0;
                return (
                  <ExpandableToken key={token} token={token} defaultValue={computed[token] ?? ''} expanded={expandedToken === token} onToggle={() => toggle(token)}>
                    <div className="flex items-center gap-4">
                      <code className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '80px' }}>{token}</code>
                      <span className="font-mono flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', minWidth: '40px' }}>{val}</span>
                      <div className="rounded-[2px] flex-shrink-0" style={{ width: `${px}px`, height: 'var(--space-3)', background: 'var(--color-navy)', opacity: 0.3 }} />
                    </div>
                  </ExpandableToken>
                );
              })}
            </div>
          </Section>

          <Section title="Layout Tokens">
            <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
              {LAYOUT_TOKENS.map(({ token, label, usage }) => (
                <ExpandableToken key={token} token={token} defaultValue={computed[token] ?? ''} expanded={expandedToken === token} onToggle={() => toggle(token)}>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <code className="font-mono font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '180px' }}>{token}</code>
                    <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', minWidth: '60px' }}>{computed[token] ?? '…'}</span>
                    <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{label} · {usage}</span>
                  </div>
                </ExpandableToken>
              ))}
            </div>
          </Section>

          <Section title="Fragrance Cell — fragrance-cell.tsx">
            <Note>Col 1 on every compliment row. Name = --text-lg serif italic · House = --text-xs sans uppercase.</Note>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" secondary="Baccarat Rouge 540" />
            </div>
            <div style={{ borderBottom: '1px solid var(--color-row-divider)', padding: 'var(--space-4) 0' }}>
              <FragranceCell name="Oud Wood" house="Tom Ford" type="Eau de Parfum" />
            </div>
          </Section>

          <Section title="Buttons — button.tsx">
            <Note>Never use bare button with inline styles.</Note>
            <Row label="variant=primary">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="primary">Log Compliment</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>navy bg · cream text · --text-sm · 0.08em tracking · 3px radius</span>
              </div>
            </Row>
            <Row label="variant=secondary">
              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="secondary">Find Fragrances</Button>
                <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>cream-dark bg · navy text</span>
              </div>
            </Row>
          </Section>

          <Section title="Filter Pills — tab-pill.tsx">
            <Note>Relation tabs on compliments page. Active = navy bg + cream text. Inactive = cream-dark bg + navy-mid text.</Note>
            <div className="flex flex-wrap gap-2">
              <TabPill label="All" count={12} active={true} onClick={() => {}} />
              <TabPill label="Strangers" count={4} active={false} onClick={() => {}} />
              <TabPill label="Friends" count={3} active={false} onClick={() => {}} />
              <TabPill label="Colleagues" count={2} active={false} onClick={() => {}} />
            </div>
          </Section>

          <Section title="Select / Dropdown — select.tsx">
            <Note>Never use native select. size="auto" for sort/filter (auto-sizes to longest option). size="full" for form fields.</Note>
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

          <Section title="Row List — Compliments page">
            <Note>CSS grid: max-content minmax(0,1fr) auto · col-gap --space-6 · each row subgrid · click to edit.</Note>
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

          <Section title="Sidebar — Sidebar.tsx">
            <Note>var(--sidebar-width) · navy bg · fixed on mobile with backdrop overlay, relative on desktop.</Note>
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

          <Section title="Topbar — Topbar.tsx">
            <Note>Required on every page. h = --header-height · px = --topbar-px (mobile: --topbar-px-mobile) · cream bg · sand-light border.</Note>
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

          <Section title="Login Page — app/page.tsx">
            <Note>Full-screen navy bg · logo = --text-logo · tagline = --text-xxs · IPA = --text-md · user buttons = --color-white-subtle bg + --color-white-dim border.</Note>
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
      </PageContent>
    </>
  );
}
