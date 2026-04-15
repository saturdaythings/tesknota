# tesknota — Architecture

Fragrance journal. Next.js 15 App Router, static export, Cloudflare Pages.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth + DB | Supabase (email+password, Postgres, RLS) |
| Hosting | Cloudflare Pages (static export, `out/`) |
| XLSX | SheetJS (`xlsx`) — import template generation + file parsing |

## File Map

```
app/
  layout.tsx              -- root layout: fonts, metadata, UserProvider
  globals.css             -- design tokens, Tailwind v4 theme, shadcn mappings
  page.tsx                -- login screen (profile picker + password)
  (app)/
    layout.tsx            -- AppShell + auth guard; DataErrorBanner inside DataProvider
    dashboard/page.tsx    -- stats, spotlight, scent signature, recent frags
    collection/page.tsx   -- full collection table with search + filter
    wishlist/page.tsx     -- want-to-buy / want-to-smell / identify later
    compliments/page.tsx  -- compliment log
    analytics/page.tsx    -- accord heatmap, compliment map, collection timeline
    friend/page.tsx       -- friend's dashboard view
    import/page.tsx       -- Search DB tab + Import File tab (XLSX/CSV with community data)
    settings/page.tsx     -- account info, data export, admin link
    admin/page.tsx        -- API spend, usage, errors, audit, community flags (Kiana only)

components/
  layout/
    AppShell.tsx          -- full-height flex shell (sidebar + main)
    Sidebar.tsx           -- dark navy nav sidebar with mobile drawer
    Topbar.tsx            -- category/title header with mobile hamburger
  ui/
    frag-form.tsx         -- 2-step add/edit fragrance modal
    comp-form.tsx         -- add/edit compliment modal (months stored as "01"-"12")
    frag-row.tsx          -- table row for a user fragrance
    frag-detail.tsx       -- slide-in detail panel; community flag submission inline
    filter-bar.tsx        -- FilterBar + FilterChip + FamilyChip
    stat-box.tsx          -- StatBox + StatsGrid
    section-header.tsx    -- SectionHeader (title + optional right slot)
    modal.tsx             -- Modal with overlay, header, body, footer, focus trap
    accord-cloud.tsx      -- horizontal accord bar chart
    bot-drawer.tsx        -- AI assistant drawer
    cmd-palette.tsx       -- command palette (Cmd+K)
    toast.tsx             -- toast notifications

lib/
  utils.ts                -- cn() utility (clsx + twMerge)
  user-context.tsx        -- UserProvider, useUser, signIn, signOut, profiles
  data-context.tsx        -- DataProvider: fragrances, compliments, communityFrags + CRUD
  mobile-nav-context.tsx  -- MobileNavProvider for sidebar open/close
  frag-utils.ts           -- starsStr, getAccords, getCompCount, addedThisMonth, MONTHS, etc.
  data/
    index.ts              -- loadAllData (fragrances + compliments + community frags)
    mutations.ts          -- appendFrag, updateFrag, deleteFrag, appendComp, updateComp, deleteComp,
                            enrichFragranceCommunityData, submitCommunityFlag
  supabase.ts             -- Supabase client (publishable key)

types/
  index.ts                -- UserFragrance, UserCompliment, CommunityFrag, enums
```

## Data Model

### Supabase tables

| Table | Key columns |
|-------|------------|
| `user_profiles` | id (UUID), name, email |
| `fragrances` | id, name, house, type, name_normalized, house_normalized, source, avg_price, top_notes, mid_notes, base_notes, accords, community_rating, parfumo_rating, community_longevity_label, community_sillage_label |
| `user_fragrances` | id, user_id, fragrance_id (FK → fragrances), name, house, status, sizes, type, personal_rating, personal_notes, where_bought, purchase_month, purchase_year, purchase_price, created_at |
| `user_compliments` | id, user_id, primary_frag_id (FK → fragrances), primary_frag_name, gender, relation, month, year, city, country, notes |
| `community_flags` | id, user_id (FK → auth.users), fragrance_id (FK → fragrances), fragrance_name, fragrance_house, field_flagged, user_note, resolved, created_at |
| `activity_log` | id, user_id, action_type, created_at |
| `api_log` | id, user_id, feature, tokens_in, tokens_out, cost_usd, latency_ms, status, error_message |
| `pending_entries` | id, user_id, raw_input, resolved |

### Deduplication

Community fragrances (`fragrances` table) deduplicate on `(name_normalized, house_normalized, lower(coalesce(type,'')))`. Different types (EDP vs Extrait vs Body Spray) are distinct rows. `findOrCreateFragId` in `mutations.ts` handles upsert on save. `enrichFragranceCommunityData` patches community fields (notes, accords, ratings) without overwriting existing data.

### Community flagging

Users can flag incorrect community data from the `frag-detail` panel. Flags go to `community_flags` with the fragrance, field, and an optional note. Kiana (admin) sees all flags in the admin Flags tab and can mark them resolved.

## Import

Import page (`/import`) has two tabs:

**Search Database** — searches the 455-row `fragrances` community table; opens the standard add form.

**Import File** — accepts `.xlsx` or `.csv`:
- Download template: two-sheet XLSX (Instructions + Import Data with 20 columns)
- Columns: Name, House, Status, Type, Sizes, Personal Rating, Where Bought, Purchase Month, Purchase Year, Purchase Price, Personal Notes, Top Notes, Middle Notes, Base Notes, Accords, Avg Price, Community Rating, Parfumo Rating, Longevity, Sillage
- Community data columns (notes, accords, ratings) are written to the shared `fragrances` table via `enrichFragranceCommunityData`
- Designed for AI-assisted fill-in: users can give the template to any AI tool

## Design Tokens

All tokens defined in `app/globals.css` under `:root`. Key groups:

| Group | Prefix | Examples |
|-------|--------|---------|
| Blues | `--blue` | `--blue` #2B4480, `--blue3` #1A2E5C (sidebar) |
| Off-whites | `--off` | `--off` #F4F2ED (page bg), `--off2` #EAE7DF |
| Warm tones | `--warm` | `--warm` #C8B99A, `--warm2` #E6D9C4 |
| Ink / text | `--ink` | `--ink` #1A2030, `--ink3` #556070 (secondary) |
| Blue alpha | `--b1`–`--b4` | Borders and overlays |

## Fonts

Loaded via `next/font/google`. CSS variables:

| Variable | Font | Use |
|----------|------|-----|
| `--serif` | Playfair Display | Headings, fragrance names |
| `--script` | Cormorant Garamond | Editorial, sidebar logo |
| `--mono` | DM Mono | Labels, data, metadata |
| `--body` | Jost | Body text, inputs |

## Mobile

- Sidebar is a fixed drawer on mobile, toggled by hamburger in Topbar
- All page `<main>` elements use `px-4 py-5 md:p-[26px]` for responsive padding
- Dashboard "Recently added" shows table on desktop, cards on mobile
- Topbar always visible; sidebar collapses to off-canvas
- Minimum font size 12px (text-xs) throughout for WCAG compliance

## Auth

`UserProvider` (Supabase Auth) persists session in localStorage. On load, fetches `user_profiles` to populate app profile (name, etc.). `signIn`/`signOut` delegate to `supabase.auth`.

## Deployment

- Static export: `npm run build` → `out/`
- Cloudflare Pages: auto-deploys from `main` branch of `oliver-chase/tesknota`
- Build command: `npm run build`, output: `out/`
- No server-side rendering — all dynamic data via Supabase client SDK
