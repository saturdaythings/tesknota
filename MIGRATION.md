# MIGRATION.md — tesknota vanilla JS → Next.js

Tracks what is ported, what is pending, and decisions made.

Reference app: oliver-chase/tesknota (live at tesknota.pages.dev — do not modify)
New app: oliver-chase/tesknota-fragrance

---

## Phase Status

| Phase | Status | Commit |
|-------|--------|--------|
| 1 — Scaffold + tokens | Complete | — |
| 2 — Component library | Pending | — |
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

## Pending Decisions

- **Supabase vs Google Sheets for dev data:** Phase 5 ports features using Google Sheets calls (same as reference app). Supabase replaces Sheets in a later dedicated session.
- **Auth model:** Reference app uses Google Service Account JWT in-browser. New app will use Supabase Auth. Stubbed for now.
- **Bot / AI Worker:** Port deferred — not in scope until core pages complete.
- **Admin page:** Ported last (Phase 5h). Requires Supabase for spend/usage data.
