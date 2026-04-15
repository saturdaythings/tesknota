# tesknota — Architecture

Fragrance journal. Next.js 15 App Router, static export, Cloudflare Pages.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth + DB | Supabase (email+password, Postgres, RLS) |
| Hosting | Cloudflare Pages (static export, `out/`) |
| Charts | Recharts |
| XLSX | SheetJS (`xlsx`) — import template generation + file parsing |

## File Map

```
app/
  layout.tsx              -- root layout: fonts (Inter + Cormorant Garamond), metadata, UserProvider
  globals.css             -- design tokens (v2), Tailwind v4 theme, shadcn mappings, responsive grids
  page.tsx                -- login screen (profile picker + password)
  (app)/
    layout.tsx            -- AppShell + auth guard; DataProvider wraps all app routes
    dashboard/page.tsx    -- stat cards, quick actions, signature spotlight, scent signature,
                            notification banner, friend recent activity, recent purchases table
    collection/page.tsx   -- full collection: sticky filter bar, 7-col table, fragrance cards (mobile),
                            detail side panel (desktop) / bottom sheet (mobile)
    wishlist/page.tsx     -- want-to-buy / want-to-smell / identify later
    compliments/page.tsx  -- compliment log
    analytics/page.tsx    -- 4 stat cards, time filter pills (all/year/season/month), friend toggle,
                            6 Recharts charts: collection growth, compliments over time,
                            status breakdown, rating distribution, most complimented, location breakdown
    friend/page.tsx       -- friend's dashboard view
    import/page.tsx       -- Search DB tab + Import File tab (XLSX/CSV with community data)
    settings/page.tsx     -- account info, data export, admin link
    admin/page.tsx        -- API spend, usage, errors, audit, community flags (Kiana only)

components/
  layout/
    AppShell.tsx          -- full-height flex shell (sidebar + main)
    Sidebar.tsx           -- dark navy nav sidebar with mobile drawer
    Topbar.tsx            -- category/title header with mobile hamburger
    Header.tsx            -- page-level header slot
    FloatingActionButton.tsx -- mobile FAB for quick actions
  collection/
    add-fragrance-modal.tsx  -- 3-step add fragrance: search → status/details → purchase/personal
    fragrance-card.tsx       -- mobile card for a user fragrance (name, house, accords, status badge)
    fragrance-detail-modal.tsx -- detail panel/bottom-sheet: rating, notes, sizes, compliments, edit/remove
  wishlist/
    add-to-wishlist-modal.tsx  -- add fragrance to wishlist
    wishlist-detail-panel.tsx  -- wishlist item detail panel
  compliments/
    log-compliment-modal.tsx   -- log a compliment (fragrance, relation, location, month/year)
  ui/
    Icons.ts              -- Lucide icon re-exports (Search, Plus, Star, Flag, etc.)
    badge.tsx             -- Badge with variants: collection, wishlist, finished, identify_later, etc.
    button.tsx            -- Button (shadcn)
    card.tsx              -- Card (shadcn)
    input.tsx             -- Input (shadcn)
    textarea.tsx          -- Textarea (shadcn)
    select.tsx            -- Select (shadcn)
    form.tsx              -- Form (shadcn)
    skeleton.tsx          -- Skeleton (shadcn)
    modal.tsx             -- Modal with overlay, header, body, footer, focus trap
    filter-bar.tsx        -- FilterBar + FilterChip + FamilyChip
    filter-panel.tsx      -- Collapsible filter panel
    stat-box.tsx          -- StatBox + StatsGrid
    stat-card.tsx         -- StatCard for dashboard/analytics
    section-header.tsx    -- SectionHeader (title + optional right slot)
    accord-cloud.tsx      -- horizontal accord bar chart
    bot-drawer.tsx        -- AI assistant drawer
    cmd-palette.tsx       -- command palette (Cmd+K)
    toast.tsx             -- toast notifications
    dropdown.tsx          -- Dropdown menu
    multi-select.tsx      -- Multi-select input
    search-input.tsx      -- Search input with debounce
    pagination.tsx        -- Pagination controls
    divider.tsx           -- Divider
    empty-state.tsx       -- Empty state component
    StarRating.tsx        -- Interactive star rating
    frag-form.tsx         -- Legacy: add/edit fragrance form (replaced by collection/add-fragrance-modal)
    comp-form.tsx         -- Compliment quick-log form
    frag-row.tsx          -- Legacy: table row for a user fragrance
    frag-detail.tsx       -- Legacy: slide-in detail panel

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
  index.ts                -- UserFragrance, UserCompliment, CommunityFrag, FragranceStatus, STATUS_LABELS
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

Users can flag incorrect community data from the detail panel. Flags go to `community_flags` with the fragrance, field, and an optional note. Kiana (admin) sees all flags in the admin Flags tab and can mark them resolved.

## Import

Import page (`/import`) has two tabs:

**Search Database** — searches the `fragrances` community table; opens the standard add form.

**Import File** — accepts `.xlsx` or `.csv`:
- Download template: two-sheet XLSX (Instructions + Import Data with 20 columns)
- Columns: Name, House, Status, Type, Sizes, Personal Rating, Where Bought, Purchase Month, Purchase Year, Purchase Price, Personal Notes, Top Notes, Middle Notes, Base Notes, Accords, Avg Price, Community Rating, Parfumo Rating, Longevity, Sillage
- Community data columns (notes, accords, ratings) are written to the shared `fragrances` table via `enrichFragranceCommunityData`
- Designed for AI-assisted fill-in: users can give the template to any AI tool

## Design System (v2)

All tokens defined in `app/globals.css` under `:root`. Tailwind v4 `@theme inline` maps them to utility classes.

### Brand palette

| Token | Value | Use |
|-------|-------|-----|
| `--color-navy` | `#1E2D45` | Primary text, dark backgrounds |
| `--color-cream` | `#F5F0E8` | Page background, card fill |
| `--color-cream-dark` | `#EDE8DF` | Borders, subtle backgrounds |
| `--color-sand` | `#C8B89A` | Muted text, labels |
| `--color-sand-light` | `#E8E0D0` | Accord chips, tag fills |
| `--color-accent` | `#2D4A6B` | Links, interactive elements |
| `--color-accent-light` | `#4A6E96` | Hover states, lighter accents |

### Type scale

| Token | Size | Use |
|-------|------|-----|
| `--text-xs` | 12px | Minimum — labels, metadata |
| `--text-sm` | 13px | Secondary text, table cells |
| `--text-base` | 15px | Body text |
| `--text-md` | 17px | Slightly emphasized body |
| `--text-lg` | 20px | Section subheadings |
| `--text-xl` | 26px | Page subheadings |
| `--text-2xl` | 36px | Page titles |
| `--text-hero` | 56px | Hero/display |

### Typography utility classes

| Class | Description |
|-------|-------------|
| `.text-body` | 15px sans, navy |
| `.text-secondary` | 13px sans, sand |
| `.text-label` | 11px sans 500, uppercase spaced, sand |
| `.text-subheading` | 20px serif italic, navy |
| `.text-meta` | 12px sans, sand |
| `.text-page-title` | 36px serif italic, navy |

### Spacing

4px grid: `--space-1` (4px) through `--space-16` (64px).

### Responsive grid classes

| Class | Behavior |
|-------|---------|
| `.dash-stat-grid` | 1 col → 2 col @400px → 4 col @900px |
| `.dash-spotlight-grid` | 1 col → 55/45 split @768px |
| `.dash-activity-grid` | 1 col → 2 col @640px |

## Fonts

Loaded via `next/font/google`, injected as CSS variables.

| Variable | Font | Use |
|----------|------|-----|
| `--font-sans` | Inter | Body text, UI labels, all sans copy |
| `--font-serif` | Cormorant Garamond | Fragrance names, headings, italic editorial |

## Mobile

- Sidebar is a fixed drawer on mobile, toggled by hamburger in Topbar
- Collection page: table on desktop, cards on mobile
- Detail panel: 380px side panel on desktop, 90vh bottom sheet on mobile (drag-to-dismiss)
- FloatingActionButton on mobile for quick actions
- Minimum font size 12px throughout for WCAG compliance

## Auth

`UserProvider` (Supabase Auth) persists session in localStorage. On load, fetches `user_profiles` to populate app profile (name, etc.). `signIn`/`signOut` delegate to `supabase.auth`.

## Deployment

- Static export: `npm run build` → `out/`
- Cloudflare Pages: auto-deploys from `main` branch of `oliver-chase/tesknota`
- Build command: `npm run build`, output: `out/`
- No server-side rendering — all dynamic data via Supabase client SDK
