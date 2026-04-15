# tesknota-fragrance — Architecture

Next.js rewrite of the vanilla JS tesknota app. Reference app: oliver-chase/tesknota (do not modify).

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 with App Router + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth + DB | Supabase (stubbed — wired in a later session) |
| Data (dev) | Google Sheets API (ported from reference app) |
| Hosting | Cloudflare Pages (static export via `output: "export"`) |

## File Map

```
app/
  layout.tsx          — root layout: fonts, metadata, body wrapper
  globals.css         — all design tokens + shadcn + Tailwind theme
  page.tsx            — AppShell preview shell (identity screen — Phase 3)

components/
  layout/
    AppShell.tsx      — full-height flex shell (sidebar + main)
    Sidebar.tsx       — dark navy sidebar: logo, nav sections, user footer
    Topbar.tsx        — topbar: category/title + search slot + actions slot
  ui/
    button.tsx        — Button with tesknota variants: blue, warm, ghost, bare, danger
    stat-box.tsx      — StatBox + StatsGrid (stats row pattern)
    section-header.tsx — SectionHeader with title + right slot
    filter-bar.tsx    — FilterBar + FilterChip + FamilyChip
    modal.tsx         — Modal with overlay, header, body, footer + focus trap
    form.tsx          — FormGroup, FormRow, FieldOptions + fieldClass/textareaClass

lib/
  utils.ts            — shadcn cn() utility
  data/               — stub data functions (Phase 4), real calls (Phase 5+)

types/
  index.ts            — barrel export for all TypeScript interfaces (Phase 4)

next.config.ts        — static export + Cloudflare Pages config
```

## Design Token Mapping

All tokens from `css/tokens.css` in the reference app are preserved in `app/globals.css`.

Two tokens are renamed to avoid shadcn semantic conflicts:
- `--muted` (#5A6E85 slate color) → `--slate` / `--color-slate`
- `--rose` (#B87068) → `--rose-tk` / `--color-rose-tk`

shadcn `--muted` is mapped to `--off2` (#EAE7DF) as a subtle background surface.

## Fonts

Loaded via `next/font/google` in `app/layout.tsx`. CSS variables:

| Variable | Font | Use |
|----------|------|-----|
| `--font-playfair` | Playfair Display | `--serif` — headings |
| `--font-cormorant` | Cormorant Garamond | `--script` — editorial |
| `--font-dm-mono` | DM Mono | `--mono` — labels, data |
| `--font-jost` | Jost | `--body` — body text, default |

## Pages (from reference app)

| Route | Page | JS module(s) |
|-------|------|-------------|
| `/` | Identity screen | `identity.js` |
| `/dashboard` | Dashboard | `dashboard.js` |
| `/collection` | My Collection | `collection.js`, `detail.js`, `add-frag.js` |
| `/wishlist` | Wishlist | `wishlist.js` |
| `/compliments` | Compliments | `compliments.js`, `add-comp.js` |
| `/analytics` | Analytics | `analytics.js`, `analytics-collection.js` |
| `/friend` | Friend profile | `friend.js` |
| `/import` | Import | `import.js` |
| `/settings` | Settings | — |
| `/admin` | Admin | `admin.js` |

## Data Models (from reference app)

Defined in Phase 4. Sourced from: `state.js`, `data.js`, `seed.js`, `fragdb.js`.

| Sheet tab | Model | Key fields |
|-----------|-------|-----------|
| users | User | id, name, createdAt |
| userFragrances | UserFragrance | userId, fragranceId, status, bottleSize, type, personalRating, notes |
| userCompliments | UserCompliment | complimentId, userId, primaryFragranceId, complimenterGender, relation, month, year, locationName |
| fragranceDB | FragranceDB | fragranceId, fragranceName, fragranceHouse, fragranceType, fragranceAccords, topNotes, middleNotes, baseNotes, avgPrice |

## Identity Model

Two users: Kiana (u1) and Sylvia (u2). Selected on each visit via landing screen.
No session persistence beyond localStorage selection.

## Cloudflare Pages

- `output: "export"` in `next.config.ts` — fully static build
- `images: { unoptimized: true }` — required for static export
- `trailingSlash: true` — Cloudflare Pages routing compatibility
- Build command: `npm run build`
- Output directory: `out/`

## Phase Status

| Phase | Status |
|-------|--------|
| 1 — Scaffold + tokens | Complete |
| 2 — Component library | Complete |
| 3 — Route shells | Pending |
| 4 — TypeScript interfaces + data stubs | Pending |
| 5+ — Feature port (page by page) | Pending |
