"use client";

import { Topbar } from '@/components/layout/Topbar';
import { PageContent } from '@/components/layout/PageContent';
import { Button } from '@/components/ui/button';
import { TabPill } from '@/components/ui/tab-pill';
import { FragranceCell } from '@/components/ui/fragrance-cell';
import { FieldLabel, OptionalTag, RequiredMark } from '@/components/ui/field-label';
import { Select } from '@/components/ui/select';

// ── Helpers ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div
        className="font-sans font-medium uppercase mb-4"
        style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--color-navy-mid)', borderBottom: '1px solid var(--color-cream-dark)', paddingBottom: '8px' }}
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
      <div className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', minWidth: '160px', paddingTop: '2px', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Swatch({ color, label, hex }: { color: string; label: string; hex: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div
        className="flex-shrink-0 rounded-[2px] border"
        style={{ width: '32px', height: '32px', background: color, borderColor: 'rgba(30,45,69,0.15)' }}
      />
      <div>
        <div className="font-sans font-medium" style={{ fontSize: '12px', color: 'var(--color-navy)' }}>{label}</div>
        <div className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>{hex}</div>
      </div>
    </div>
  );
}

function TypeSpec({ label, children, spec }: { label: string; children: React.ReactNode; spec: string }) {
  return (
    <div className="flex items-baseline gap-6 mb-3">
      <div className="flex-1">{children}</div>
      <div className="font-sans text-right flex-shrink-0" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', minWidth: '220px', letterSpacing: '0.04em' }}>
        {spec}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <>
      <Topbar title="Design System" />
      <PageContent maxWidth="860px">

        {/* Colors */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 gap-x-8 md:grid-cols-3">
            <Swatch color="#1E2D45" label="Navy" hex="--color-navy · #1E2D45" />
            <Swatch color="#3A5070" label="Navy Mid" hex="--color-navy-mid · #3A5070" />
            <Swatch color="#2D4A6B" label="Accent" hex="--color-accent · #2D4A6B" />
            <Swatch color="#F5F0E8" label="Cream" hex="--color-cream · #F5F0E8" />
            <Swatch color="#EAE3D8" label="Cream Dark" hex="--color-cream-dark · #EAE3D8" />
            <Swatch color="#C8B89A" label="Sand" hex="--color-sand · #C8B89A" />
            <Swatch color="#D9CEBC" label="Sand Light" hex="--color-sand-light · #D9CEBC" />
            <Swatch color="#8B1A1A" label="Destructive" hex="--color-destructive · #8B1A1A" />
            <Swatch color="rgba(30,45,69,0.15)" label="Row Divider" hex="rgba(30,45,69,0.15)" />
          </div>
          <div className="mt-4 font-sans" style={{ fontSize: '12px', color: 'var(--color-navy-mid)' }}>
            Never hardcode hex values in pages. Use <code className="font-mono">var(--color-*)</code> tokens only. The only permitted raw rgba values are the three opacity variants: <code className="font-mono">rgba(30,45,69,0.8)</code> meta text, <code className="font-mono">rgba(30,45,69,0.7)</code> notes, <code className="font-mono">rgba(30,45,69,0.15)</code> row dividers.
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div
            className="font-sans mb-3"
            style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}
          >
            Two fonts only: <strong>Cormorant Garamond</strong> (serif, always italic) and <strong>Inter</strong> (sans, always upright). Never swap their roles.
          </div>
          <TypeSpec label="Fragrance name" spec="Serif italic · 20px · 400 · navy">
            <span className="font-serif italic" style={{ fontSize: '20px', color: 'var(--color-navy)' }}>Fragrance Name</span>
          </TypeSpec>
          <TypeSpec label="Secondary / layered" spec="Serif italic · 16px · 400 · navy">
            <span className="font-serif italic" style={{ fontSize: '16px', color: 'var(--color-navy)' }}>+ Layering Name</span>
          </TypeSpec>
          <TypeSpec label="Notes / quote" spec="Serif italic · 16px · 400 · rgba(30,45,69,0.7) · lh 1.6">
            <span className="font-serif italic" style={{ fontSize: '16px', color: 'rgba(30,45,69,0.7)', lineHeight: 1.6 }}>worn to a dinner, first comment within 20 minutes</span>
          </TypeSpec>
          <TypeSpec label="Modal title / page section" spec="Serif italic · 22px · 400 · navy">
            <span className="font-serif italic" style={{ fontSize: '22px', color: 'var(--color-navy)' }}>Log a Compliment</span>
          </TypeSpec>
          <TypeSpec label="Page title" spec="Serif italic · 36px · 400 · navy">
            <span className="font-serif italic" style={{ fontSize: '36px', color: 'var(--color-navy)' }}>Compliments</span>
          </TypeSpec>
          <div style={{ borderTop: '1px solid var(--color-cream-dark)', margin: '12px 0' }} />
          <TypeSpec label="House name / nav items / sidebar" spec="Sans upright uppercase · 12px · 400 · 0.1em">
            <span className="font-sans uppercase" style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'var(--color-navy)' }}>Maison Margiela</span>
          </TypeSpec>
          <TypeSpec label="Meta (relation · gender · location)" spec="Sans upright · 12px · 400 · rgba(30,45,69,0.8)">
            <span className="font-sans" style={{ fontSize: '12px', color: 'rgba(30,45,69,0.8)' }}>STRANGER · FEMALE · COFFEE SHOP</span>
          </TypeSpec>
          <TypeSpec label="Date" spec="Sans upright · 12px · 400 · navy">
            <span className="font-sans" style={{ fontSize: '12px', color: 'var(--color-navy)' }}>APR 2025</span>
          </TypeSpec>
          <TypeSpec label="Body copy" spec="Sans upright · 15px · 400 · navy">
            <span className="font-sans" style={{ fontSize: '15px', color: 'var(--color-navy)' }}>Body copy text</span>
          </TypeSpec>
          <TypeSpec label="Caption / small body" spec="Sans upright · 14px · 400 · navy">
            <span className="font-sans" style={{ fontSize: '14px', color: 'var(--color-navy)' }}>Caption text</span>
          </TypeSpec>
          <TypeSpec label="Field label" spec="Sans upright uppercase · 11px · 500 · 0.1em · navy">
            <span className="font-sans font-medium uppercase" style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--color-navy)' }}>Field Label</span>
          </TypeSpec>
          <TypeSpec label="Button" spec="Sans upright uppercase · 13px · 500 · 0.08em">
            <span className="font-sans font-medium uppercase" style={{ fontSize: '13px', letterSpacing: '0.08em', color: 'var(--color-navy)' }}>Log Compliment</span>
          </TypeSpec>
          <TypeSpec label="Filter pill / section label" spec="Sans upright uppercase · 12px · 400 · 0.08em">
            <span className="font-sans uppercase" style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--color-navy)' }}>All Strangers Friends</span>
          </TypeSpec>
          <TypeSpec label="Search / text input" spec="Sans upright · 12px · 400 · 0.08em · rgba(30,45,69,0.8) empty · navy filled">
            <span className="font-sans" style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'rgba(30,45,69,0.8)' }}>placeholder text</span>
            <span className="font-sans ml-4" style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--color-navy)' }}>typed value</span>
          </TypeSpec>
        </Section>

        {/* FragranceCell */}
        <Section title="Fragrance Cell (Column 1 — list rows)">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Component: <code className="font-mono">{'<FragranceCell>'}</code> from <code className="font-mono">components/ui/fragrance-cell.tsx</code>. Use on every list row — Collection, Wishlist, Compliments.
          </div>
          <div style={{ borderBottom: '1px solid rgba(30,45,69,0.15)', padding: '16px 0' }}>
            <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" secondary="Baccarat Rouge 540" />
          </div>
          <div style={{ borderBottom: '1px solid rgba(30,45,69,0.15)', padding: '16px 0' }}>
            <FragranceCell name="Oud Wood" house="Tom Ford" type="Eau de Parfum" />
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Component: <code className="font-mono">{'<Button variant="...">'}</code> from <code className="font-mono">components/ui/button.tsx</code>. Never use bare <code className="font-mono">{'<button>'}</code> with inline styles.
          </div>
          <Row label="variant=primary">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="primary">Log Compliment</Button>
              <span className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)' }}>navy bg · cream text · 13px · 0.08em · 3px radius · min-h 40px</span>
            </div>
          </Row>
          <Row label="variant=secondary">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="secondary">Cancel</Button>
              <span className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)' }}>cream-dark bg · navy text</span>
            </div>
          </Row>
          <Row label="variant=destructive">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="destructive">Delete Compliment</Button>
              <span className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)' }}>destructive red bg · cream text</span>
            </div>
          </Row>
          <Row label="variant=ghost">
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="ghost">Ghost</Button>
              <span className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)' }}>transparent bg · navy text</span>
            </div>
          </Row>
        </Section>

        {/* Filter pills */}
        <Section title="Filter Pills (TabPill)">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Component: <code className="font-mono">{'<TabPill>'}</code> from <code className="font-mono">components/ui/tab-pill.tsx</code>. Used for page filters AND toggle groups inside modals.
          </div>
          <Row label="states">
            <div className="flex flex-wrap gap-2">
              <TabPill label="All" count={12} active={true} onClick={() => {}} />
              <TabPill label="Strangers" count={4} active={false} onClick={() => {}} />
              <TabPill label="Friends" count={3} active={false} onClick={() => {}} />
            </div>
          </Row>
          <div className="font-sans mt-2" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Active: navy bg · cream text · 1px solid navy. Inactive: transparent bg · navy text · 1px solid rgba(30,45,69,0.8). 12px sans uppercase 0.08em · 6px 12px padding · 2px radius.
          </div>
        </Section>

        {/* Dropdowns */}
        <Section title="Dropdowns (Select)">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Component: <code className="font-mono">{'<Select>'}</code> from <code className="font-mono">components/ui/select.tsx</code>. Never use native <code className="font-mono">{'<select>'}</code>.
          </div>
          <Row label="sort / form select">
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
          <div className="font-sans mt-2" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Trigger: h-9 · cream bg · 1px solid rgba(30,45,69,0.8) · 3px radius. Dropdown: cream bg · same border · shadow 0 4px 16px rgba(0,0,0,0.12) · 36px rows · 12px sans navy options.
          </div>
        </Section>

        {/* Form fields */}
        <Section title="Form Fields (Modal / Add Popup)">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            All add/log/edit flows use <code className="font-mono">Modal + ModalHeader + ModalBody + ModalFooter</code>. Field gap: <code className="font-mono">gap-5</code> (20px). Paired fields: <code className="font-mono">grid grid-cols-2 gap-4</code>.
          </div>
          <Row label="FieldLabel">
            <div className="flex items-center gap-4 flex-wrap">
              <FieldLabel>Fragrance <RequiredMark /></FieldLabel>
              <FieldLabel>Notes <OptionalTag /></FieldLabel>
              <span className="font-sans" style={{ fontSize: '11px', color: 'var(--color-navy-mid)' }}>11px sans uppercase 0.1em · RequiredMark 13px red · OptionalTag 13px navy-mid</span>
            </div>
          </Row>
          <Row label="text input (empty)">
            <input
              readOnly
              placeholder="Work, friend's house, coffee shop..."
              className="w-full h-9 px-3 rounded-[2px] font-sans outline-none placeholder:text-[var(--color-navy-mid)]"
              style={{ maxWidth: '320px', fontSize: '12px', fontWeight: 400, letterSpacing: '0.08em', background: 'var(--color-cream)', border: '1px solid rgba(30,45,69,0.8)', color: 'rgba(30,45,69,0.8)' }}
            />
          </Row>
          <Row label="text input (filled)">
            <input
              readOnly
              value="Café Lento, Brooklyn"
              className="w-full h-9 px-3 rounded-[2px] font-sans outline-none"
              style={{ maxWidth: '320px', fontSize: '12px', fontWeight: 400, letterSpacing: '0.08em', background: 'var(--color-cream)', border: '1px solid rgba(30,45,69,0.8)', color: 'var(--color-navy)' }}
            />
          </Row>
          <Row label="textarea (notes)">
            <textarea
              readOnly
              defaultValue="She stopped mid-sentence to ask what I was wearing."
              rows={2}
              className="w-full p-3 rounded-[2px] font-sans outline-none resize-none placeholder:text-[var(--color-navy-mid)]"
              style={{ maxWidth: '320px', fontSize: '12px', fontWeight: 400, letterSpacing: '0.08em', background: 'var(--color-cream)', border: '1px solid rgba(30,45,69,0.8)', color: 'var(--color-navy)' }}
            />
          </Row>
          <div className="font-sans mt-1" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            All inputs: h-9 · 12px sans · 0.08em · 2px radius · cream bg · rgba(30,45,69,0.8) border. Empty text: rgba(30,45,69,0.8). Filled text: var(--color-navy). Placeholder: var(--color-navy-mid). Notes: maxLength 160 · resize-none · line-clamp-2 in list.
          </div>
        </Section>

        {/* Sidebar */}
        <Section title="Left Sidebar">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Component: <code className="font-mono">{'<Sidebar>'}</code> from <code className="font-mono">components/layout/Sidebar.tsx</code>. Fixed 220px wide, navy background.
          </div>
          <div className="rounded-[3px] overflow-hidden" style={{ maxWidth: '220px', background: 'var(--color-navy)' }}>
            <div className="px-5 pt-6 pb-4">
              <div className="font-serif italic" style={{ fontSize: '28px', color: 'var(--color-cream)', lineHeight: 1 }}>tęsknota</div>
              <div className="font-sans font-medium uppercase mt-1" style={{ fontSize: '10px', color: 'rgba(245,240,232,0.7)', letterSpacing: '0.22em' }}>Fragrance Tracker</div>
            </div>
            <div className="mt-4">
              <div className="px-5 mb-1 font-sans font-medium uppercase" style={{ fontSize: '12px', color: 'rgba(200,184,154,0.6)', letterSpacing: '0.08em' }}>MY SPACE</div>
              {[
                { label: 'Dashboard', active: false },
                { label: 'My Collection', active: true },
                { label: 'Wishlist', active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center font-sans uppercase"
                  style={{
                    height: '40px', paddingLeft: '20px', paddingRight: '20px',
                    borderLeft: item.active ? '3px solid var(--color-cream)' : '3px solid transparent',
                    background: item.active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: item.active ? 'var(--color-cream)' : 'rgba(200,184,154,0.8)',
                    fontSize: '12px', letterSpacing: '0.1em',
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <div className="mt-4 mb-2 px-5 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <div className="font-sans mb-1" style={{ fontSize: '14px', color: 'var(--color-cream)' }}>Kiana</div>
              <div className="font-sans font-medium uppercase" style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'rgba(200,184,154,0.8)' }}>Sign Out</div>
            </div>
          </div>
          <div className="font-sans mt-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Nav items: 12px sans uppercase 0.1em — same as house name. Section labels: 12px rgba(200,184,154,0.6) 0.08em. Active item: cream + left border + rgba(255,255,255,0.08) bg. Inactive: rgba(200,184,154,0.8). Username: 14px sans cream. Sign Out: 12px 0.08em rgba(200,184,154,0.8).
          </div>
        </Section>

        {/* Topbar */}
        <Section title="Page Header (Topbar)">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Component: <code className="font-mono">{'<Topbar title="..." />'}</code> from <code className="font-mono">components/layout/Topbar.tsx</code>. Required on every page — pairs with <code className="font-mono">{'<PageContent>'}</code>.
          </div>
          <div className="rounded-[3px] overflow-hidden" style={{ background: 'var(--color-cream)', border: '1px solid var(--color-cream-dark)' }}>
            <div className="flex items-center gap-3 px-[26px]" style={{ height: '56px' }}>
              <div className="flex-1">
                <div className="font-sans font-medium uppercase" style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'var(--color-navy-mid)' }}>TĘSKNOTA</div>
                <div className="font-serif" style={{ fontSize: '18px', color: 'var(--color-navy)', lineHeight: 1.2 }}>Compliments</div>
              </div>
            </div>
          </div>
          <div className="font-sans mt-2" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Height: 56px · bg cream · border-bottom 1px sand-light · padding 18px mobile / 26px desktop. App label: 10px sans uppercase 0.12em navy-mid. Page title: 18px serif navy lh 1.2. Content padding always mirrors topbar padding.
          </div>
        </Section>

        {/* Row list */}
        <Section title="Row List Pattern">
          <div className="font-sans mb-3" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            No <code className="font-mono">{'<table>'}</code>. Flexbox rows with border-bottom. Three columns: FragranceCell (col 1), meta+notes (col 2), date (col 3).
          </div>
          <div style={{ borderBottom: '1px solid rgba(30,45,69,0.15)', padding: '16px 0' }}>
            <div className="flex gap-6 items-start">
              <FragranceCell name="Replica — Coffee Breeze" house="Maison Margiela" type="Eau de Parfum" />
              <div className="flex-1 min-w-0">
                <div className="font-sans mb-1" style={{ fontSize: '12px', color: 'rgba(30,45,69,0.8)' }}>STRANGER · FEMALE · COFFEE SHOP</div>
                <div className="font-serif italic line-clamp-2" style={{ fontSize: '16px', color: 'rgba(30,45,69,0.7)', lineHeight: 1.6 }}>stopped me to ask what I was wearing</div>
              </div>
              <div className="font-sans flex-shrink-0 text-right" style={{ fontSize: '12px', color: 'var(--color-navy)', minWidth: '72px' }}>APR 2025</div>
            </div>
          </div>
          <div className="font-sans mt-2" style={{ fontSize: '11px', color: 'var(--color-navy-mid)', letterSpacing: '0.04em' }}>
            Row: min-h 80px · padding 16px 0 · gap-6 · border-bottom rgba(30,45,69,0.15) · hover rgba(232,224,208,0.3). Notes: line-clamp-2 in list view.
          </div>
        </Section>

      </PageContent>
    </>
  );
}
