"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { Select } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { FragSearch } from '@/components/ui/frag-search';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { PerPageControl } from '@/components/ui/per-page-control';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FieldLabel, OptionalTag, RequiredMark } from '@/components/ui/field-label';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import { Pagination } from '@/components/ui/pagination';
import { StarRating } from '@/components/ui/StarRating';
import { StatBox, StatsGrid } from '@/components/ui/stat-box';
import { SectionHeader } from '@/components/ui/section-header';

// ── Typography tokens ──────────────────────────────────────
// specimen: text rendered at actual size/font/case as it appears in the app
// usages: every surface where this token is applied

type FontStack = 'serif' | 'sans';

interface TypeUsage {
  surface: string;
  example: string;
}

interface TypeToken {
  token: string;
  label: string;
  font: FontStack;
  italic: boolean;
  tracking: string | null;
  uppercase: boolean;
  specimen: string;
  usages: TypeUsage[];
}

const TYPE_TOKENS: TypeToken[] = [
  {
    token: '--text-xxs',
    label: 'XXS · 10px',
    font: 'sans',
    italic: false,
    tracking: 'var(--tracking-xl)',
    uppercase: true,
    specimen: 'FRAGRANCE TRACKER',
    usages: [
      { surface: 'Sidebar', example: '"Fragrance Tracker" tagline below logotype — tracking-xl, cream-muted' },
      { surface: 'Login', example: '"Fragrance Tracker" tagline below logotype — tracking-xl, cream-muted' },
    ],
  },
  {
    token: '--text-xs',
    label: 'XS · 12px',
    font: 'sans',
    italic: false,
    tracking: 'var(--tracking-xs)',
    uppercase: false,
    specimen: 'MAISON MARGIELA · APR 2025',
    usages: [
      { surface: 'Topbar', example: 'App label (TĘSKNOTA) — uppercase, tracking-lg, navy-mid' },
      { surface: 'Sidebar', example: 'Section labels (MY SPACE), nav items, username, Sign Out' },
      { surface: 'Compliments', example: 'Meta line (STRANGER · MALE · COFFEE SHOP), date column (APR 2025)' },
      { surface: 'Collection', example: 'House name, date column, filter counts' },
      { surface: 'Modal forms', example: 'FieldLabel above every input (FRAGRANCE NAME, NOTES)' },
      { surface: 'Filter pills', example: 'Pill label text (ALL, STRANGERS, FRIENDS)' },
      { surface: 'Buttons', example: 'All button labels (LOG COMPLIMENT, ADD TO COLLECTION)' },
      { surface: 'Design System', example: 'Token names and computed values throughout' },
    ],
  },
  {
    token: '--text-sm',
    label: 'SM · 13px',
    font: 'sans',
    italic: false,
    tracking: 'var(--tracking-xs)',
    uppercase: false,
    specimen: 'Date — Newest first',
    usages: [
      { surface: 'Select', example: 'Dropdown trigger text and all option labels' },
      { surface: 'FragSearch', example: 'Search input text and autocomplete result rows' },
    ],
  },
  {
    token: '--text-label',
    label: 'Label · 11px',
    font: 'sans',
    italic: false,
    tracking: 'var(--tracking-xs)',
    uppercase: false,
    specimen: 'FRAGRANCE NAME',
    usages: [
      { surface: 'Modal forms', example: 'FieldLabel component above every form field' },
      { surface: 'Settings', example: 'Section sub-labels and field group headers' },
    ],
  },
  {
    token: '--text-ui',
    label: 'UI · 14px',
    font: 'sans',
    italic: false,
    tracking: 'var(--tracking-xs)',
    uppercase: false,
    specimen: 'Kiana',
    usages: [
      { surface: 'Sidebar', example: 'Username in footer (Kiana / Sylvia)' },
      { surface: 'Login', example: '"Who are you?" prompt text' },
      { surface: 'Empty state', example: 'Supporting description text below empty-state title' },
    ],
  },
  {
    token: '--text-note',
    label: 'Note · 16px',
    font: 'serif',
    italic: true,
    tracking: null,
    uppercase: false,
    specimen: 'stopped mid-sentence to ask what I was wearing',
    usages: [
      { surface: 'Compliments', example: 'Italic quote text in notes column — color: meta-text, lh 1.6' },
      { surface: 'FragranceCell', example: 'Secondary (dupe-for) fragrance name when present' },
    ],
  },
  {
    token: '--text-md',
    label: 'MD · 17px',
    font: 'serif',
    italic: true,
    tracking: null,
    uppercase: false,
    specimen: '[tɛsk-ˈnɔ-ta] · a deep longing',
    usages: [
      { surface: 'Sidebar', example: 'IPA phonetic tagline below brand identity area — color: sand' },
      { surface: 'Login', example: 'IPA tagline "[tɛsk-ˈnɔ-ta] · a deep longing for what is absent or past" — color: sand' },
    ],
  },
  {
    token: '--text-lg',
    label: 'LG · 20px',
    font: 'serif',
    italic: true,
    tracking: null,
    uppercase: false,
    specimen: 'Replica — Coffee Breeze',
    usages: [
      { surface: 'FragranceCell', example: 'Primary fragrance name in every Compliments and Collection row' },
      { surface: 'FragSearch', example: 'Fragrance name in search autocomplete results' },
      { surface: 'Modal', example: 'Fragrance name in log / edit modal heading area' },
    ],
  },
  {
    token: '--text-empty-title',
    label: 'Empty Title · 22px',
    font: 'serif',
    italic: true,
    tracking: null,
    uppercase: false,
    specimen: 'No compliments yet',
    usages: [
      { surface: 'Compliments', example: 'Empty-state headline when no records exist' },
      { surface: 'Collection', example: 'Empty-state headline when collection is empty' },
      { surface: 'Wishlist', example: 'Empty-state headline' },
    ],
  },
  {
    token: '--text-page-title',
    label: 'Page Title · 24px',
    font: 'serif',
    italic: true,
    tracking: null,
    uppercase: false,
    specimen: 'Collection',
    usages: [
      { surface: 'Topbar', example: 'Page title on every app page — color: navy, lh 1.2' },
      { surface: 'Login', example: 'User name buttons (Kiana, Sylvia) — same size, serif italic, cream on white-subtle' },
    ],
  },
  {
    token: '--text-logo',
    label: 'Logo · 28px',
    font: 'serif',
    italic: true,
    tracking: null,
    uppercase: false,
    specimen: 'tęsknota',
    usages: [
      { surface: 'Sidebar', example: 'tęsknota logotype at top of sidebar nav — color: cream, lh 1' },
      { surface: 'Login', example: 'tęsknota logotype centered on login screen — color: cream, lh none' },
    ],
  },
];

// ── Color grid tokens (column order — similar families adjacent) ───────────────

const COLOR_COLS = [
  '--color-navy', '--color-navy-mid', '--color-navy-backdrop',
  '--color-cream', '--color-cream-muted', '--color-cream-faint',
  '--color-sand', '--color-sand-light', '--color-sand-label', '--color-sand-muted',
  '--color-white-subtle', '--color-white-dim', '--color-white-mid',
  '--color-row-divider', '--color-row-hover', '--color-meta-text',
  '--color-live',
] as const;

type ColorCol = typeof COLOR_COLS[number];

const COLOR_COL_LABELS: Record<ColorCol, string> = {
  '--color-navy': 'navy',
  '--color-navy-mid': 'navy-mid',
  '--color-navy-backdrop': 'backdrop',
  '--color-cream': 'cream',
  '--color-cream-muted': 'cream-m',
  '--color-cream-faint': 'cream-f',
  '--color-sand': 'sand',
  '--color-sand-light': 'sand-l',
  '--color-sand-label': 'sand-lb',
  '--color-sand-muted': 'sand-m',
  '--color-white-subtle': 'white-s',
  '--color-white-dim': 'white-d',
  '--color-white-mid': 'white-m',
  '--color-row-divider': 'row-div',
  '--color-row-hover': 'row-hov',
  '--color-meta-text': 'meta',
  '--color-live': 'live',
};

// Family groups drive column-header separators
const COLOR_FAMILIES = [
  { label: 'Navy', count: 3 },
  { label: 'Cream', count: 3 },
  { label: 'Sand', count: 4 },
  { label: 'White overlays', count: 3 },
  { label: 'Row / list', count: 3 },
  { label: '↑', count: 1 },
] as const;

interface CellPreview {
  bg: string;
  text?: string;
  textColor?: string;
  outline?: string;
  leftBorder?: string;
  fontFamily?: FontStack;
  uppercase?: boolean;
  letterSpacing?: string;
  type?: 'box' | 'text' | 'line' | 'dot';
}

interface ColorGridRowData {
  id: string;
  label: string;
  cells: Partial<Record<ColorCol, CellPreview>>;
}

const COLOR_GRID: ColorGridRowData[] = [
  {
    id: 'sidebar-identity',
    label: 'Sidebar — brand identity',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', type: 'box' },
      '--color-cream': { bg: 'var(--color-navy)', text: 'tęsknota', textColor: 'var(--color-cream)', fontFamily: 'serif' },
      '--color-cream-muted': { bg: 'var(--color-navy)', text: 'FRAGRANCE TRACKER', textColor: 'var(--color-cream-muted)', fontFamily: 'sans', uppercase: true, letterSpacing: 'var(--tracking-xl)' },
      '--color-sand': { bg: 'var(--color-navy)', text: '[tɛsk-ˈnɔ-ta]', textColor: 'var(--color-sand)', fontFamily: 'serif' },
    },
  },
  {
    id: 'sidebar-nav-active',
    label: 'Sidebar — active nav item',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', type: 'box' },
      '--color-cream': { bg: 'var(--color-navy)', text: 'My Collection', textColor: 'var(--color-cream)', fontFamily: 'sans', leftBorder: '3px solid var(--color-cream)' },
      '--color-white-subtle': { bg: 'var(--color-white-subtle)', text: 'My Collection', textColor: 'var(--color-cream)', fontFamily: 'sans', leftBorder: '3px solid var(--color-cream)' },
    },
  },
  {
    id: 'sidebar-nav-inactive',
    label: 'Sidebar — section labels + inactive nav',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', type: 'box' },
      '--color-sand-label': { bg: 'var(--color-navy)', text: 'MY SPACE', textColor: 'var(--color-sand-label)', fontFamily: 'sans', uppercase: true, letterSpacing: 'var(--tracking-wide)' },
      '--color-sand-muted': { bg: 'var(--color-navy)', text: 'Dashboard', textColor: 'var(--color-sand-muted)', fontFamily: 'sans' },
    },
  },
  {
    id: 'sidebar-user',
    label: 'Sidebar — user footer',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', type: 'box' },
      '--color-cream': { bg: 'var(--color-navy)', text: 'Kiana', textColor: 'var(--color-cream)', fontFamily: 'sans' },
      '--color-sand-muted': { bg: 'var(--color-navy)', text: 'SIGN OUT', textColor: 'var(--color-sand-muted)', fontFamily: 'sans', uppercase: true, letterSpacing: 'var(--tracking-wide)' },
      '--color-white-subtle': { bg: 'var(--color-navy)', outline: '1px solid var(--color-white-subtle)', type: 'box' },
    },
  },
  {
    id: 'topbar',
    label: 'Topbar',
    cells: {
      '--color-navy': { bg: 'var(--color-cream)', text: 'Collection', textColor: 'var(--color-navy)', fontFamily: 'serif' },
      '--color-navy-mid': { bg: 'var(--color-cream)', text: 'TĘSKNOTA', textColor: 'var(--color-navy-mid)', fontFamily: 'sans', uppercase: true, letterSpacing: 'var(--tracking-lg)' },
      '--color-cream': { bg: 'var(--color-cream)', type: 'box' },
      '--color-sand-light': { bg: 'var(--color-cream)', outline: '1px solid var(--color-sand-light)', type: 'box' },
    },
  },
  {
    id: 'frag-search',
    label: 'FragSearch — find fragrance',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', type: 'box' },
      '--color-cream-faint': { bg: 'var(--color-navy)', text: 'Find fragrance…', textColor: 'var(--color-cream-faint)', fontFamily: 'sans' },
      '--color-white-subtle': { bg: 'var(--color-white-subtle)', text: 'Chanel No. 5', textColor: 'var(--color-cream)', fontFamily: 'sans', outline: '1px solid var(--color-white-dim)' },
      '--color-white-dim': { bg: 'var(--color-white-subtle)', text: 'Find fragrance…', textColor: 'var(--color-cream-faint)', fontFamily: 'sans', outline: '1px solid var(--color-white-dim)' },
      '--color-white-mid': { bg: 'var(--color-white-subtle)', text: 'Chanel No. 5', textColor: 'var(--color-cream)', fontFamily: 'sans', outline: '1px solid var(--color-white-mid)' },
    },
  },
  {
    id: 'login',
    label: 'Login page',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', type: 'box' },
      '--color-cream': { bg: 'var(--color-navy)', text: 'tęsknota', textColor: 'var(--color-cream)', fontFamily: 'serif' },
      '--color-cream-muted': { bg: 'var(--color-navy)', text: 'FRAGRANCE TRACKER', textColor: 'var(--color-cream-muted)', fontFamily: 'sans', uppercase: true },
      '--color-sand': { bg: 'var(--color-navy)', text: '[tɛsk-ˈnɔ-ta]', textColor: 'var(--color-sand)', fontFamily: 'serif' },
      '--color-white-subtle': { bg: 'var(--color-white-subtle)', text: 'Kiana', textColor: 'var(--color-cream)', fontFamily: 'serif', outline: '1px solid var(--color-white-dim)' },
      '--color-white-dim': { bg: 'var(--color-white-subtle)', text: 'Kiana', textColor: 'var(--color-cream)', fontFamily: 'serif', outline: '1px solid var(--color-white-dim)' },
    },
  },
  {
    id: 'compliment-row',
    label: 'Compliment / collection row',
    cells: {
      '--color-cream': { bg: 'var(--color-cream)', type: 'box' },
      '--color-navy': { bg: 'var(--color-cream)', text: 'APR 2025', textColor: 'var(--color-navy)', fontFamily: 'sans', uppercase: true, letterSpacing: 'var(--tracking-md)' },
      '--color-row-divider': { bg: 'var(--color-cream)', outline: '1px solid var(--color-row-divider)', type: 'line' },
      '--color-row-hover': { bg: 'var(--color-row-hover)', type: 'box' },
      '--color-meta-text': { bg: 'var(--color-cream)', text: 'stopped mid-sentence', textColor: 'var(--color-meta-text)', fontFamily: 'serif' },
      '--color-live': { bg: 'var(--color-navy)', type: 'dot', textColor: 'var(--color-live)' },
    },
  },
  {
    id: 'button-primary',
    label: 'Button — primary',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', text: 'LOG COMPLIMENT', textColor: 'var(--color-cream)', fontFamily: 'sans', uppercase: true, letterSpacing: 'var(--tracking-wide)' },
      '--color-cream': { bg: 'var(--color-navy)', text: 'LOG COMPLIMENT', textColor: 'var(--color-cream)', fontFamily: 'sans', uppercase: true },
    },
  },
  {
    id: 'filter-pill-active',
    label: 'Filter pill — active',
    cells: {
      '--color-navy': { bg: 'var(--color-navy)', text: 'ALL', textColor: 'var(--color-cream)', fontFamily: 'sans', uppercase: true, outline: '1px solid var(--color-navy)' },
      '--color-cream': { bg: 'var(--color-navy)', text: 'ALL', textColor: 'var(--color-cream)', fontFamily: 'sans', uppercase: true },
    },
  },
  {
    id: 'filter-pill-inactive',
    label: 'Filter pill — inactive',
    cells: {
      '--color-navy': { bg: 'var(--color-cream)', text: 'STRANGERS', textColor: 'var(--color-navy)', fontFamily: 'sans', uppercase: true },
      '--color-cream': { bg: 'var(--color-cream)', type: 'box' },
      '--color-meta-text': { bg: 'var(--color-cream)', text: 'STRANGERS', textColor: 'var(--color-navy)', fontFamily: 'sans', uppercase: true, outline: '1px solid var(--color-meta-text)' },
    },
  },
  {
    id: 'mobile-overlay',
    label: 'Mobile sidebar overlay',
    cells: {
      '--color-navy-backdrop': { bg: 'var(--color-navy-backdrop)', type: 'box' },
    },
  },
];

// ── Other token manifests (unchanged) ─────────────────────

const SPACE_TOKENS = ['--space-1', '--space-4', '--space-5', '--space-6', '--space-8', '--space-10'];

const LAYOUT_TOKENS = [
  { token: '--sidebar-width',    label: 'Sidebar Width',    usage: 'Fixed sidebar width' },
  { token: '--header-height',    label: 'Header Height',    usage: 'Topbar height' },
  { token: '--topbar-px',        label: 'Topbar PX',        usage: 'Topbar horizontal padding (desktop)' },
  { token: '--topbar-px-mobile', label: 'Topbar PX Mobile', usage: 'Topbar horizontal padding (mobile)' },
  { token: '--page-margin',      label: 'Page Margin',      usage: 'PageContent horizontal padding (left + right); right edge of Topbar actions' },
];

// ── Section manifest (drives anchor nav) ──────────────────


// ── Mode context ──────────────────────────────────────────

const DesignModeContext = createContext<'reference' | 'edit'>('reference');

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
        if (el.closest('[data-hardcode-banner]') || el.closest('[data-gallery-entry]')) return;
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
        style={{ marginBottom: 'var(--space-6)', border: `1px solid ${clean ? 'var(--color-sand-light)' : 'var(--color-meta-text)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
      >
        <button
          onClick={() => violations.length > 0 && setExpanded((v) => !v)}
          className="w-full flex items-center justify-between font-sans font-normal uppercase text-left"
          style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)', background: clean ? 'var(--color-cream)' : 'var(--color-navy)', color: clean ? 'var(--color-navy)' : 'var(--color-cream)', border: 'none', cursor: violations.length > 0 ? 'pointer' : 'default' }}
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
            <div className="font-sans mb-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: 'var(--tracking-xs)' }}>
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

function TokenEditPanel({ tokenName, defaultValue, onClose, onDraftChange }: { tokenName: string; defaultValue: string; onClose: () => void; onDraftChange?: (v: string) => void }) {
  const [committedValue] = useState(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
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
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(tokenName, draft);
    onDraftChange?.(draft);
  }, [draft, tokenName]);

  useEffect(() => {
    return () => {
      if (publishedRef.current !== committedRef.current) {
        document.documentElement.style.setProperty(tokenName, publishedRef.current);
      } else {
        document.documentElement.style.removeProperty(tokenName);
      }
      onDraftChange?.(publishedRef.current);
    };
  }, [tokenName]);

  const isDirty = draft !== publishedValue;
  const isAtDefault = draft === defaultValue;

  async function callWorker(value: string, message?: string): Promise<{ ok: boolean; sha?: string; error?: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { ok: false, error: 'No active session — sign in again' };
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
      return { ok: true, sha: data.sha ?? '' };
    } catch (err) {
      document.documentElement.style.setProperty(tokenName, publishedRef.current);
      setDraft(publishedRef.current);
      return { ok: false, error: err instanceof Error ? err.message : 'Publish failed' };
    }
  }

  async function publish() {
    if (!isDirty || status === 'publishing') return;
    setStatus('publishing');
    setActiveAction('publish');
    setErrorMsg('');
    const result = await callWorker(draft);
    if (result.ok) { setStatus('success'); setSha(result.sha ?? ''); }
    else { setStatus('error'); setErrorMsg(result.error ?? 'Publish failed'); }
    setActiveAction(null);
  }

  async function resetToDefault() {
    if (isAtDefault || status === 'publishing') return;
    setStatus('publishing');
    setActiveAction('reset');
    setErrorMsg('');
    document.documentElement.style.setProperty(tokenName, defaultValue);
    setDraft(defaultValue);
    const result = await callWorker(defaultValue, 'revert(design): restore ' + tokenName + ' to default');
    if (result.ok) { setStatus('success'); setSha(result.sha ?? ''); }
    else { setStatus('error'); setErrorMsg(result.error ?? 'Reset failed'); }
    setActiveAction(null);
  }

  return (
    <div className="rounded-[var(--radius-sm)]" style={{ background: 'var(--color-navy)', padding: 'var(--space-4)', marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-mono tracking-[var(--tracking-xs)]" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>{tokenName}</div>
        <button
          onClick={onClose}
          className="font-sans bg-transparent border-0 cursor-pointer p-0 leading-none select-none"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)' }}
          title="Close editor"
        >
          ×
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); if (status !== 'idle') { setStatus('idle'); setErrorMsg(''); } }}
          spellCheck={false}
          onKeyDown={(e) => { if (e.key === 'Enter') publish(); if (e.key === 'Escape') onClose(); }}
          className="font-mono flex-1 min-w-0 rounded-[var(--radius-sm)] outline-none"
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
        {isDirty && (
          <button
            onClick={() => setPreviewOpen(true)}
            disabled={status === 'publishing'}
            className="font-sans flex-shrink-0 rounded-[var(--radius-sm)] cursor-pointer disabled:opacity-50 disabled:cursor-default"
            style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', background: 'transparent', border: '1px solid var(--color-white-dim)', color: 'var(--color-sand-muted)' }}
          >
            Preview
          </button>
        )}
        <button
          onClick={publish}
          disabled={!isDirty || status === 'publishing'}
          className={'font-sans font-medium flex-shrink-0 rounded-[var(--radius-sm)] border-0 tracking-[var(--tracking-wide)] disabled:opacity-50 ' + (isDirty ? 'cursor-pointer' : 'cursor-default')}
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
      {previewOpen && (
        <PreviewOverlay
          tokenName={tokenName}
          draft={draft}
          onBack={() => setPreviewOpen(false)}
          callWorker={callWorker}
          onPublishSuccess={() => { setPreviewOpen(false); setStatus('success'); }}
        />
      )}
    </div>
  );
}

// ── Preview overlay ────────────────────────────────────────

const PREVIEW_ROUTES = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Compliments', path: '/compliments' },
  { label: 'Collection', path: '/collection' },
  { label: 'Login', path: '/' },
];

function PreviewOverlay({ tokenName, draft, onBack, callWorker, onPublishSuccess }: {
  tokenName: string;
  draft: string;
  onBack: () => void;
  callWorker: (value: string, message?: string) => Promise<{ ok: boolean; sha?: string; error?: string }>;
  onPublishSuccess: () => void;
}) {
  const [route, setRoute] = useState('/dashboard');
  const [status, setStatus] = useState<'idle' | 'publishing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [sha, setSha] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function injectToken() {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'TOKEN_PREVIEW', token: tokenName, value: draft },
      window.location.origin
    );
  }

  async function handlePublish() {
    if (status === 'publishing' || status === 'success') return;
    setStatus('publishing');
    setErrorMsg('');
    const result = await callWorker(draft);
    if (result.ok) {
      setSha(result.sha ?? '');
      setStatus('success');
      onPublishSuccess();
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Publish failed');
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--color-navy)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-white-subtle)', flexShrink: 0 }}>
        <button
          onClick={onBack}
          className="font-sans flex-shrink-0"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: 'var(--tracking-xs)' }}
        >
          Back
        </button>
        <div className="flex gap-2 flex-1 justify-center">
          {PREVIEW_ROUTES.map((r) => (
            <button
              key={r.path}
              onClick={() => setRoute(r.path)}
              className="font-sans uppercase flex-shrink-0 cursor-pointer"
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 400,
                letterSpacing: 'var(--tracking-wide)',
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-sm)',
                background: route === r.path ? 'var(--color-cream)' : 'transparent',
                color: route === r.path ? 'var(--color-navy)' : 'var(--color-sand-muted)',
                border: route === r.path ? '1px solid var(--color-cream)' : '1px solid var(--color-white-dim)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {status === 'error' && (
            <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>{errorMsg}</span>
          )}
          {status === 'success' && (
            <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>committed {sha.slice(0, 7)}</span>
          )}
          <button
            onClick={handlePublish}
            disabled={status === 'publishing' || status === 'success'}
            className="font-sans font-medium rounded-[var(--radius-sm)] border-0 tracking-[var(--tracking-wide)] cursor-pointer disabled:opacity-50 disabled:cursor-default"
            style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-2) var(--space-4)', background: 'var(--color-cream)', color: 'var(--color-navy)' }}
          >
            {status === 'publishing' ? 'Publishing\u2026' : 'Publish'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) var(--space-6)', borderBottom: '1px solid var(--color-white-dim)', flexShrink: 0 }}>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand)' }}>{tokenName}</span>
        <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-sand-muted)' }}>{draft}</span>
      </div>
      <iframe
        ref={iframeRef}
        key={route}
        src={route}
        onLoad={injectToken}
        style={{ flex: 1, border: 'none', display: 'block' }}
        title="Token preview"
      />
    </div>,
    document.body
  );
}

// ── ExpandableToken (used by spacing, layout sections) ─────

function ExpandableToken({ token, defaultValue, expanded, onToggle, onDraftChange, children }: { token: string; defaultValue: string; expanded: boolean; onToggle: () => void; onDraftChange?: (v: string) => void; children: React.ReactNode }) {
  const mode = useContext(DesignModeContext);
  if (mode === 'reference') {
    return <div>{children}</div>;
  }
  return (
    <div>
      <div
        onClick={onToggle}
        className="flex items-center gap-2"
        style={{ cursor: 'pointer' }}
        title={expanded ? 'Click to close editor' : 'Click to edit token'}
      >
        <div className="flex-1 min-w-0">{children}</div>
        <span
          className="flex-shrink-0 select-none"
          style={{
            fontSize: 'var(--text-xs)',
            color: expanded ? 'var(--color-navy)' : 'var(--color-meta-text)',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s, color 0.15s',
            lineHeight: 1,
          }}
        >
          ▾
        </span>
      </div>
      {expanded && <TokenEditPanel tokenName={token} defaultValue={defaultValue} onClose={onToggle} onDraftChange={onDraftChange} />}
    </div>
  );
}

// ── Typography row ─────────────────────────────────────────

function TypeRow({ token, label, font, italic, tracking, uppercase, specimen, usages, computed, expandedToken, toggle, mode }: TypeToken & { computed: string; expandedToken: string | null; toggle: (t: string) => void; mode: 'reference' | 'edit' }) {
  const [showUsages, setShowUsages] = useState(false);
  const specimenClass = font === 'serif' ? 'font-serif italic' : 'font-sans';

  return (
    <div style={{ borderBottom: '1px solid var(--color-row-divider)' }}>
      <div style={{ padding: 'var(--space-3) 0', display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-4)', alignItems: 'start' }}>
        <div>
          <span
            className={specimenClass}
            style={{
              fontSize: `var(${token})`,
              color: 'var(--color-navy)',
              lineHeight: 1.4,
              letterSpacing: tracking ?? undefined,
              textTransform: uppercase ? 'uppercase' : undefined,
              display: 'block',
              marginBottom: 'var(--space-1)',
            }}
          >
            {specimen}
          </span>
          <div className="flex items-baseline gap-3 flex-wrap">
            <code className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{token}</code>
            <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{computed || '\u2026'}</span>
            <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>
              {label} \u00b7 {font === 'serif' ? 'serif italic' : 'sans upright'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowUsages((v) => !v)}
          className="font-sans flex-shrink-0"
          style={{ fontSize: 'var(--text-xs)', color: showUsages ? 'var(--color-navy)' : 'var(--color-meta-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1) 0', whiteSpace: 'nowrap', marginTop: 'var(--space-1)' }}
        >
          {showUsages ? '▲' : '▾'} {usages.length} {usages.length === 1 ? 'use' : 'uses'}
        </button>
      </div>

      {showUsages && (
        <div style={{ paddingBottom: 'var(--space-3)', paddingLeft: 'var(--space-4)', paddingTop: 'var(--space-1)' }}>
          {usages.map((u, i) => (
            <div key={i} className="flex gap-3" style={{ marginBottom: 'var(--space-2)' }}>
              <span className="font-sans font-medium flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', minWidth: '90px' }}>{u.surface}</span>
              <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>{u.example}</span>
            </div>
          ))}
          {mode === 'edit' && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <button
                onClick={() => toggle(token)}
                className="font-mono"
                style={{ fontSize: 'var(--text-xs)', color: expandedToken === token ? 'var(--color-navy)' : 'var(--color-meta-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {expandedToken === token ? '\u00d7 close editor' : '\u270e edit token'}
              </button>
              {expandedToken === token && (
                <TokenEditPanel tokenName={token} defaultValue={computed} onClose={() => toggle(token)} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Color grid cell ────────────────────────────────────────

const CELL_W = 58;
const LABEL_W = 172;

function GridCell({ cell }: { cell: CellPreview }) {
  const base: React.CSSProperties = {
    width: `${CELL_W - 8}px`,
    height: '38px',
    borderRadius: 'var(--radius-sm)',
    background: cell.bg,
    border: cell.outline,
    borderLeft: cell.leftBorder,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    margin: '0 auto',
    flexShrink: 0,
  };

  if (cell.type === 'dot') {
    return (
      <div style={base}>
        <div style={{ width: '8px', height: '8px', borderRadius: '9999px', background: cell.textColor ?? 'var(--color-meta-text)' }} />
      </div>
    );
  }

  if (cell.type === 'line') {
    return (
      <div style={base}>
        <div style={{ width: '100%', height: '1px', background: 'var(--color-row-divider)' }} />
      </div>
    );
  }

  if (!cell.text || cell.type === 'box') {
    return <div style={base} />;
  }

  return (
    <div style={base} title={cell.text}>
      <span
        className={cell.fontFamily === 'serif' ? 'font-serif italic' : 'font-sans'}
        style={{
          fontSize: 'var(--text-xs)',
          color: cell.textColor,
          textTransform: cell.uppercase ? 'uppercase' : undefined,
          letterSpacing: cell.letterSpacing,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: `${CELL_W - 10}px`,
          lineHeight: 1.3,
          display: 'block',
          padding: '0 var(--space-1)',
        }}
      >
        {cell.text}
      </span>
    </div>
  );
}

// ── Color grid ─────────────────────────────────────────────

function ColorGrid({ grid, computed, expandedToken, toggle, mode }: { grid: ColorGridRowData[]; computed: Record<string, string>; expandedToken: string | null; toggle: (t: string) => void; mode: 'reference' | 'edit' }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const totalW = LABEL_W + COLOR_COLS.length * CELL_W;

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const gridCols = `${LABEL_W}px repeat(${COLOR_COLS.length}, ${CELL_W}px)`;

  return (
    <div style={{ overflowX: 'auto', marginLeft: 'calc(-1 * var(--page-margin))', marginRight: 'calc(-1 * var(--page-margin))', paddingLeft: 'var(--page-margin)', paddingBottom: 'var(--space-2)' }}>
      <div style={{ minWidth: `${totalW}px` }}>

        {/* Family labels row */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, marginBottom: 0 }}>
          <div />
          {COLOR_FAMILIES.map((fam) => (
            <div
              key={fam.label}
              className="font-sans"
              style={{
                gridColumn: `span ${fam.count}`,
                fontSize: 'var(--text-xs)',
                color: 'var(--color-meta-text)',
                letterSpacing: 'var(--tracking-xs)',
                paddingBottom: 'var(--space-1)',
                borderBottom: '1px solid var(--color-row-divider)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {fam.label}
            </div>
          ))}
        </div>

        {/* Token name headers */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, marginBottom: 'var(--space-2)' }}>
          <div />
          {COLOR_COLS.map((token) => (
            <div
              key={token}
              className="font-mono"
              style={{ fontSize: '9px', color: 'var(--color-meta-text)', textAlign: 'center', letterSpacing: '0.02em', lineHeight: 1.4, paddingBottom: 'var(--space-1)' }}
            >
              {COLOR_COL_LABELS[token]}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {grid.map((row) => {
          const isExpanded = expandedRows.has(row.id);
          const usedTokens = (Object.keys(row.cells) as ColorCol[]);

          return (
            <div key={row.id} style={{ borderBottom: '1px solid var(--color-row-divider)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center', padding: 'var(--space-2) 0' }}>
                <div className="flex items-center gap-1" style={{ paddingRight: 'var(--space-3)' }}>
                  <button
                    onClick={() => toggleRow(row.id)}
                    className="font-sans text-left flex-1 min-w-0 bg-transparent border-0 cursor-pointer p-0"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)', letterSpacing: 'var(--tracking-xs)', lineHeight: 1.4 }}
                  >
                    {row.label}
                  </button>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)', flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▾'}
                  </span>
                </div>
                {COLOR_COLS.map((token) => {
                  const cell = row.cells[token];
                  if (!cell) return <div key={token} />;
                  return <GridCell key={token} cell={cell} />;
                })}
              </div>

              {isExpanded && (
                <div style={{ paddingLeft: `${LABEL_W}px`, paddingBottom: 'var(--space-3)', paddingTop: 'var(--space-1)' }}>
                  <div className="flex flex-wrap" style={{ gap: 'var(--space-3)' }}>
                    {usedTokens.map((token) => (
                      <div key={token}>
                        {mode === 'edit' ? (
                          <button
                            onClick={() => toggle(token)}
                            className="font-mono bg-transparent border-0 cursor-pointer p-0"
                            style={{ fontSize: 'var(--text-xs)', color: expandedToken === token ? 'var(--color-navy)' : 'var(--color-navy-mid)' }}
                          >
                            {token} <span style={{ color: 'var(--color-meta-text)' }}>{computed[token] ?? '\u2026'}</span>
                          </button>
                        ) : (
                          <span className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)' }}>
                            {token} <span style={{ color: 'var(--color-meta-text)' }}>{computed[token] ?? '\u2026'}</span>
                          </span>
                        )}
                        {mode === 'edit' && expandedToken === token && (
                          <div style={{ marginTop: 'var(--space-1)' }}>
                            <TokenEditPanel tokenName={token} defaultValue={computed[token] ?? ''} onClose={() => toggle(token)} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-10" style={{ scrollMarginTop: 'var(--space-12)' }}>
      <div className="font-sans font-normal uppercase mb-4" style={{ fontSize: 'var(--text-xs)', letterSpacing: 'var(--tracking-wide)', color: 'var(--color-navy-mid)', borderBottom: '1px solid var(--color-row-divider)', paddingBottom: 'var(--space-2)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 mb-3">
      <div className="font-sans flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', minWidth: '180px', paddingTop: 'var(--space-1)', letterSpacing: 'var(--tracking-xs)' }}>
        {label}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans mt-1 mb-3" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: 'var(--tracking-xs)' }}>
      {children}
    </div>
  );
}

// ── Component gallery ─────────────────────────────────────

interface GalleryItem {
  id: string;
  name: string;
  path: string;
  pages: string[];
  tokens: string[];
  note?: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'button',
    name: 'Button',
    path: 'components/ui/button.tsx',
    pages: ['Compliments', 'Collection', 'Wishlist', 'Modals', 'Admin', 'Social (tab-action)'],
    tokens: ['--color-navy', '--color-cream', '--color-row-divider', '--color-cream-dark', '--text-sm', '--space-3', '--radius-md'],
    note: 'Variants: primary, secondary, ghost, destructive, icon, tab-action. tab-action = content-view tabs not filter pills \u2014 use TabPill for those.',
  },
  {
    id: 'input',
    name: 'Input',
    path: 'components/ui/input.tsx',
    pages: ['Add Fragrance modal', 'Log Compliment modal', 'Fragrance Detail', 'Add to Wishlist modal', 'Register', 'Profile', 'Social', 'Admin', 'Import'],
    tokens: ['--text-sm', '--color-cream', '--color-navy', '--color-meta-text', '--color-accent', '--radius-sm'],
  },
  {
    id: 'textarea',
    name: 'Textarea',
    path: 'components/ui/textarea.tsx',
    pages: ['Add / Edit modal (notes field)'],
    tokens: ['--text-sm', '--color-cream', '--color-navy', '--color-meta-text', '--color-accent', '--radius-sm'],
  },
  {
    id: 'select',
    name: 'Select',
    path: 'components/ui/select.tsx',
    pages: ['Compliments (sort / relation)', 'Collection (sort / status)', 'Modals'],
    tokens: ['--text-sm', '--color-cream', '--color-navy', '--color-sand-light', '--radius-sm'],
  },
  {
    id: 'tab-pill',
    name: 'TabPill',
    path: 'components/ui/tab-pill.tsx',
    pages: ['Compliments (filter)', 'Collection (filter)', 'Import (underline tabs)', 'Social (selector tabs)', 'Design System (nav)'],
    tokens: ['--color-navy', '--color-cream-dark', '--color-row-divider', '--color-meta-text', '--text-xs', '--text-sm', '--text-note', '--tracking-wide', '--radius-sm', '--radius-md'],
    note: '3 variants: default (filter pills, uppercase xs), underline (section nav, serif label + sans sublabel), selector (content tabs, sm mixed-case).',
  },
  {
    id: 'fragrance-cell',
    name: 'FragranceCell',
    path: 'components/ui/fragrance-cell.tsx',
    pages: ['Compliments (col 1)', 'Collection (col 1)', 'Wishlist (col 1)'],
    tokens: ['--text-note', '--text-xs', '--color-navy', '--color-meta-text'],
  },
  {
    id: 'badge',
    name: 'Badge',
    path: 'components/ui/badge.tsx',
    pages: ['Collection (status)', 'Compliments'],
    tokens: ['--color-navy', '--color-cream', '--text-xs', '--radius-sm'],
  },
  {
    id: 'field-label',
    name: 'FieldLabel \u00b7 OptionalTag \u00b7 RequiredMark',
    path: 'components/ui/field-label.tsx',
    pages: ['All modals and forms'],
    tokens: ['--text-label', '--color-navy', '--color-destructive'],
  },
  {
    id: 'empty-state',
    name: 'EmptyState',
    path: 'components/ui/empty-state.tsx',
    pages: ['Compliments (empty)', 'Collection (empty)', 'Wishlist (empty)'],
    tokens: ['--text-empty-title', '--text-ui', '--color-navy', '--color-meta-text'],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    path: 'components/ui/skeleton.tsx',
    pages: ['Compliments (loading)', 'Collection (loading)'],
    tokens: ['--color-sand-light', '--radius-sm'],
  },
  {
    id: 'search-input',
    name: 'SearchInput',
    path: 'components/ui/search-input.tsx',
    pages: ['Collection (search bar)', 'Wishlist', 'Compliments', 'Friend', 'Add Fragrance modal', 'Add to Wishlist modal', 'FloatingActionButton'],
    tokens: ['--text-sm', '--color-cream', '--color-navy', '--color-meta-text', '--radius-sm'],
  },
  {
    id: 'pagination',
    name: 'Pagination',
    path: 'components/ui/pagination.tsx',
    pages: ['Compliments', 'Collection', 'Wishlist'],
    tokens: ['--text-xs', '--color-navy', '--color-cream', '--color-meta-text', '--radius-sm'],
  },
  {
    id: 'star-rating',
    name: 'StarRating',
    path: 'components/ui/StarRating.tsx',
    pages: ['Add / Edit modal (collection)'],
    tokens: ['--color-navy', '--color-sand-light'],
    note: 'size=16 is hardcoded internally — not a token. max=5, readOnly optional.',
  },
  {
    id: 'stat-box',
    name: 'StatBox \u00b7 StatsGrid',
    path: 'components/ui/stat-box.tsx',
    pages: ['Dashboard'],
    tokens: ['--text-xs', '--color-navy', '--color-meta-text'],
    note: '34px value font size is hardcoded internally — not a token.',
  },
  {
    id: 'section-header',
    name: 'SectionHeader',
    path: 'components/ui/section-header.tsx',
    pages: ['Modals', 'Detail panels'],
    tokens: [],
    note: 'Uses legacy tokens --b2, --serif, --ink \u2014 not part of the current design system. Needs migration.',
  },
  {
    id: 'modal',
    name: 'Modal',
    path: 'components/ui/modal.tsx',
    pages: ['Modals', 'Dialogs'],
    tokens: ['--color-cream', '--shadow-lg', '--color-navy-backdrop'],
    note: 'Dialog with backdrop, close button, and keyboard support (Escape). Requires onClose handler.',
  },
  {
    id: 'multi-select',
    name: 'MultiSelect',
    path: 'components/ui/multi-select.tsx',
    pages: ['Forms'],
    tokens: ['--color-cream', '--color-cream-dark', '--color-navy', '--color-meta-text', '--color-row-hover', '--color-row-divider'],
    note: 'Dropdown with multi-selection checkboxes. Search within dropdown. Accepts options array with value/label pairs.',
  },
  {
    id: 'per-page-control',
    name: 'PerPageControl',
    path: 'components/ui/per-page-control.tsx',
    pages: ['Pagination'],
    tokens: ['--color-navy', '--font-weight-semibold'],
    note: 'Inline button group to select pagination size. Shows "25", "50", "All" options.',
  },
];

function GalleryEntry({ item, children }: { item: GalleryItem; children: React.ReactNode }) {
  return (
    <div id={`gallery-${item.id}`} style={{ borderBottom: '1px solid var(--color-row-divider)', paddingBottom: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
      <div className="flex items-baseline gap-3 flex-wrap mb-3">
        <span className="font-sans font-medium" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy)' }}>{item.name}</span>
        <code className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>{item.path}</code>
      </div>
      <div
        data-gallery-entry
        style={{ border: '1px solid var(--color-sand-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', background: 'var(--color-cream)', marginBottom: 'var(--space-3)' }}
      >
        {children}
      </div>
      {item.tokens.length > 0 && (
        <div className="flex flex-wrap" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          {item.tokens.map((t) => (
            <code key={t} className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', background: 'var(--color-cream-faint)', padding: '1px var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-sand-light)' }}>{t}</code>
          ))}
        </div>
      )}
      <div className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-meta-text)' }}>
        Used on: {item.pages.join(' \u00b7 ')}
      </div>
      {item.note && (
        <div className="font-sans mt-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: 'var(--tracking-xs)' }}>{item.note}</div>
      )}
    </div>
  );
}

function SearchInputDemo() {
  const [val, setVal] = useState('');
  return <SearchInput value={val} onChange={setVal} placeholder="Search fragrances..." />;
}

function SearchInputWithValue() {
  const [val, setVal] = useState('Oud Wood');
  return <SearchInput value={val} onChange={setVal} placeholder="Search fragrances..." />;
}

function StarRatingDemo() {
  const [rating, setRating] = useState(3);
  return <StarRating value={rating} onChange={setRating} />;
}

function StarRatingEmpty() {
  const [rating, setRating] = useState(0);
  return <StarRating value={rating} onChange={setRating} />;
}

// ── Page ───────────────────────────────────────────────────


// Simplified to 3 core sections
const DESIGN_SECTIONS = [
  { id: 'type-scale', label: 'Typography' },
  { id: 'colors', label: 'Color Usage Matrix' },
  { id: 'component-gallery', label: 'Components' },
] as const;


// ── Main page component ────────────────────────────────────

export default function DesignSystemPage() {
  const allTokens = [
    ...(COLOR_COLS as readonly string[]),
    ...TYPE_TOKENS.map((t) => t.token),
    ...SPACE_TOKENS,
    ...LAYOUT_TOKENS.map((t) => t.token),
  ];
  const computed = useComputedTokens(allTokens);
  const [mode, setMode] = useState<'reference' | 'edit'>('reference');
  const [expandedToken, setExpandedToken] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(DESIGN_SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 },
    );
    DESIGN_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  function toggle(token: string) {
    setExpandedToken((prev) => (prev === token ? null : token));
  }

  return (
    <>
      <Topbar title="Design System" actions={<FragSearch />} />
      <PageContent maxWidth="1000px">
        <DesignModeContext.Provider value={mode}>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex gap-2">
              <TabPill label="Reference" active={mode === 'reference'} onClick={() => { setMode('reference'); setExpandedToken(null); }} />
              <TabPill label="Edit" active={mode === 'edit'} onClick={() => setMode('edit')} />
            </div>
            {mode === 'edit' && (
              <span className="font-sans" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-navy-mid)', letterSpacing: 'var(--tracking-xs)' }}>
                Changes publish directly to the live site.
              </span>
            )}
          </div>

          {/* Sticky section nav */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--color-cream)',
            borderBottom: '1px solid var(--color-row-divider)',
            marginLeft: 'calc(-1 * var(--page-margin))',
            marginRight: 'calc(-1 * var(--page-margin))',
            paddingLeft: 'var(--page-margin)',
            paddingRight: 'var(--page-margin)',
            paddingTop: 'var(--space-3)',
            paddingBottom: 'var(--space-3)',
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto' }}>
              {DESIGN_SECTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  style={{
                    padding: 'var(--space-2) 0',
                    borderBottom: activeSection === id ? '2px solid var(--color-navy)' : '2px solid transparent',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: activeSection === id ? 'var(--font-weight-semibold)' : 'normal',
                    color: activeSection === id ? 'var(--color-navy)' : 'var(--color-navy-mid)',
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: TYPOGRAPHY */}
          <Section id="type-scale" title="Typography">
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy-mid)', marginBottom: 'var(--space-4)' }}>
                Each type style rendered exactly as it appears in the app. Click to expand and see where it is used.
              </p>
            </div>
            <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
              {TYPE_TOKENS.map((t) => (
                <TypeRow
                  key={t.token}
                  {...t}
                  computed={computed[t.token] ?? ''}
                  expandedToken={expandedToken}
                  toggle={toggle}
                  mode={mode}
                />
              ))}
            </div>
          </Section>

          {/* SECTION 2: COLOR USAGE MATRIX */}
          <Section id="colors" title="Color Usage Matrix">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy-mid)', marginBottom: 'var(--space-4)' }}>
                Grid showing how colors are actually used in components. Columns are color tokens. Rows are components and contexts. Each cell renders the actual combination (background, text, border) as it appears. Click rows to expand and see exact token values.
              </p>
            </div>
            <ColorGrid
              grid={COLOR_GRID}
              computed={computed}
              expandedToken={expandedToken}
              toggle={toggle}
              mode={mode}
            />
          </Section>

          {/* SECTION 3: COMPONENT GALLERY */}
          <Section id="component-gallery" title="Components">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy-mid)', marginBottom: 'var(--space-4)' }}>
                Every shared component rendered live from its actual source file. Token values listed beside each. If the component in the app does not match what renders here, that is a bug.
              </p>
            </div>

            <div className="flex flex-col" style={{ gap: 'var(--space-8)' }}>
              {GALLERY_ITEMS.map((item) => (
                <GalleryEntry key={item.id} item={item}>
                  <ComponentPreview item={item} />
                </GalleryEntry>
              ))}
            </div>
          </Section>

        </DesignModeContext.Provider>
      </PageContent>
    </>
  );
}

// ── Component preview ──────────────────────────────────────

function ComponentPreview({ item }: { item: GalleryItem }) {
  const mode = useContext(DesignModeContext) ?? 'reference';
  
  // Render examples for each component
  switch (item.id) {
    case 'button':
      return (
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      );
    case 'input':
      return <Input placeholder="Text input..." />;
    case 'textarea':
      return <Textarea placeholder="Textarea..." rows={3} />;
    case 'select':
      return (
        <Select
          options={[
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ]}
          value="a"
          onChange={() => {}}
          placeholder="Select..."
        />
      );
    case 'tab-pill':
      return (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <TabPill label="Active" active={true} onClick={() => {}} />
          <TabPill label="Inactive" active={false} onClick={() => {}} />
        </div>
      );
    case 'badge':
      return (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Badge variant="neutral">Badge 1</Badge>
          <Badge variant="neutral">Badge 2</Badge>
        </div>
      );
    case 'pagination':
      return <Pagination page={2} onPage={() => {}} total={100} pageSize={10} />;
    case 'star-rating':
      return <StarRating value={3} max={5} />;
    case 'search-input':
      return <SearchInput value="" onChange={() => {}} />;
    case 'empty-state':
      return <EmptyState icon="✦" title="No items" description="Add one to get started" />;
    case 'skeleton':
      return (
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Skeleton className="w-[60px] h-[40px]" />
          <Skeleton className="w-[200px] h-[40px]" />
        </div>
      );
    case 'field-label':
      return <div style={{ display: "flex", gap: "var(--space-2)" }}><FieldLabel>Field Label</FieldLabel><RequiredMark /></div>;
    case 'fragrance-cell':
      return <FragranceCell name="Sample Fragrance" house="Sample House" type="Eau de Parfum" />;
    case 'section-header':
      return <SectionHeader title="Section Title" />;
    case 'stat-box':
      return <StatBox label="Stat" value="42" />;
    case 'modal':
      return (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-navy-mid)' }}>
          Modal renders with backdrop, close button, and keyboard support (Escape key). Use onClose prop.
        </div>
      );
    case 'multi-select':
      return (
        <MultiSelect
          options={[
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
          ]}
          value={[]}
          onChange={() => {}}
        />
      );
    case 'per-page-control':
      return <PerPageControl value={25} onChange={() => {}} />;
    default:
      return null;
  }
}

