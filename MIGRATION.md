# MIGRATION.md — tesknota vanilla JS → Next.js

Tracks what is ported, what is pending, and decisions made.

Reference app: oliver-chase/tesknota (live at tesknota.pages.dev — do not modify)
New app: oliver-chase/tesknota-fragrance

---

## Phase Status

| Phase | Status | Commit |
|-------|--------|--------|
| 1 — Scaffold + tokens | Complete | — |
| 2 — Component library | Complete | — |
| 3 — Route shells | Pending | — |
| 4 — TypeScript interfaces + data stubs | Pending | — |
| 5a — Dashboard | Pending | — |
| 5b — Collection | Pending | — |
| 5c — Compliments | Pending | — |
| 5d — Analytics | Pending | — |
| 5e — Wishlist | Pending | — |
| 5f — Friend profile | Pending | — |
| 5g — Import | Pending | — |
| 5h — Admin | Pending | — |

---

## Phase 1 — Scaffold (Complete)

**What was done:**
- Initialized Next.js 16 with App Router + TypeScript + Tailwind CSS v4
- Installed shadcn/ui
- Mapped all design tokens from `css/tokens.css` to `app/globals.css`
- Configured `next.config.ts` for Cloudflare Pages static export
- Created folder structure: `app/`, `components/ui/`, `lib/data/`, `types/`

**Decisions:**
- `output: "export"` chosen for Cloudflare Pages compatibility. Can switch to `@cloudflare/next-on-pages` adapter later if SSR is needed for Supabase.
- `--muted` (#5A6E85 slate) renamed to `--slate` in CSS to avoid conflict with shadcn's `--muted` semantic surface token. shadcn `--muted` mapped to `--off2` (#EAE7DF).
- `--rose` renamed to `--rose-tk` for same reason (shadcn uses `--rose` in some contexts).
- Sidebar set to dark navy (`--blue3: #1A2E5C`) matching the visual treatment of the reference app.
- Four fonts loaded via `next/font/google`: Playfair Display, Cormorant Garamond, DM Mono, Jost.

---

## Phase 2 — Component Library (Complete)

**What was done:**
- `components/layout/AppShell.tsx` — flex shell container (sidebar + main)
- `components/layout/Sidebar.tsx` — dark navy sidebar: logo, nav sections with counts, user footer
- `components/layout/Topbar.tsx` — topbar: category/title + search slot + actions slot
- `components/ui/button.tsx` — replaced shadcn default with tesknota variants (blue, warm, ghost, bare, danger, sm)
- `components/ui/stat-box.tsx` — StatBox + StatsGrid (the `.stats`/`.sbox` pattern)
- `components/ui/section-header.tsx` — SectionHeader with title + right slot (the `.sh` pattern)
- `components/ui/filter-bar.tsx` — FilterBar, FilterChip, FamilyChip (the `.fbar`/`.fc`/`.fam-chip` patterns)
- `components/ui/modal.tsx` — Modal with overlay, sticky header/footer, focus trap, Escape key, WCAG ARIA
- `components/ui/form.tsx` — FormGroup, FormRow, FieldOptions + `fieldClass`/`textareaClass` string exports
- `app/page.tsx` — replaced Next.js boilerplate with AppShell preview using live components

**Decisions:**
- Button uses plain `<button>` element (not @base-ui/react/button) — tesknota buttons are simple native elements; no ARIA complexity needed.
- Modal uses custom focus trap (not @base-ui/react/dialog) — avoids portal/hydration issues with static export.
- `fieldClass`/`textareaClass` exported as strings (not components) — input elements vary too much per use case; let feature code compose them into `<input className={fieldClass} />`.
- Sidebar uses Next.js `usePathname()` for active link state — works with App Router static export.

---

## Pending Decisions

- **Supabase vs Google Sheets for dev data:** Phase 5 ports features using Google Sheets calls (same as reference app). Supabase replaces Sheets in a later dedicated session.
- **Auth model:** Reference app uses Google Service Account JWT in-browser. New app will use Supabase Auth. Stubbed for now.
- **Bot / AI Worker:** Port deferred — not in scope until core pages complete.
- **Admin page:** Ported last (Phase 5h). Requires Supabase for spend/usage data.
