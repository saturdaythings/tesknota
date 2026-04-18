# Commit Audit — 48-Hour Sprint

**Date:** 2026-04-18  
**Total commits:** 172 in 48 hours  
**Audited:** All 172 (top 50 in full detail; 51-172 by file + current state verification)

---

## Known Broken / Needs Fix

All P1/P2 bugs fixed in pair review session (2026-04-18). See "Fixed" section below.

---

## Fixed (pair review — commits 1 & 2)

**Commits reviewed:** `a864409` (make addLabel/onAdd optional) + `29732a1` (revert)

**Issues found and fixed:**

| File | Issue | Fix applied |
|------|-------|-------------|
| `fragrance-cell.tsx` | P1: `dupeFor` prop removed by revert — desktop collection rows never showed "dupe of [name]" | Re-added `dupeFor?: string` prop and restored render block below house div |
| `fragrance-cell.tsx` | P2: gap reverted to `gap-1.5` Tailwind class instead of `var(--space-1)` token | Changed to `style={{ gap: 'var(--space-1)' }}` |
| `collection/page.tsx` | `FragranceCell` call missing `dupeFor` — dupe name would still not appear even with prop restored | Added `dupeFor={frag.dupeFor \|\| undefined}` |
| `wishlist/page.tsx` | `FragranceCell` call missing both `isDupe` and `dupeFor` — dupe info never visible in wishlist rows | Added `isDupe={frag.isDupe} dupeFor={frag.dupeFor \|\| undefined}` |
| `frag-row.tsx` | `FragRow` component was dead code — never imported by any file. Carried 6 unused imports, 3 dead constants, and a bare `<button>` design system violation | Deleted `FragRow` and all code only used by it; kept only `StatusBadge` (used by 4 files) |

**Tech debt fixed:**
- `page-filter-bar.tsx`: `SortDirButton` + `Clear` used `style={{ height: "36px" }}` to override Button's `h-8`. Replaced with `className="h-9 ..."` — `tailwind-merge` resolves correctly. Also removed `showAdd` intermediate variable; inlined as `{addLabel && onAdd && ...}` eliminating the `onAdd!` non-null assertion.
- `frag-row.tsx`: Merged two `import from "@/types"` statements into one.
- `collection/page.tsx`: Moved two `import` statements that appeared after a `const` declaration back to the top of the import block.

---

## What Is Fully Working (verified against live source)

### Social system
- `/social` page: follow/unfollow/accept/decline/star, friend search, collection comparison, notifications
- Profile page at `/profile`: editable, username uniqueness check on blur
- Register page at `/register`: username uniqueness, login link
- `lib/data/index.ts` + `mutations.ts`: full CRUD for `profiles`, `follows`, `notifications`, `discount_codes`, `pending_tasks`
- Nav: Profile nav link removed; Settings under Manage; profile via username click in sidebar

### Admin dashboard
- Fully dynamic: 6 live Supabase queries (api_log, activity_log, profiles, community_flags, user_fragrances, pending_entries)
- Pending Entries tab: renders, dismiss works
- Sidebar dot: driven by `pendingCount > 0` from layout.tsx subscription
- Dev Bot tab: chat UI + `/dev-chat` CF Function with GitHub read/write tools, admin-only via session check

### Collection
- CSS subgrid row architecture (`frag-row.tsx`): no `<tr>`/`<td>`, pure grid
- `collection-list.tsx` + `collection-filters.tsx` extracted from page.tsx
- `?filter=missing` URL param pre-filters incomplete entries
- User isolation, sort, edit panel all working
- `lib/tokens.ts` deleted (was replaced by CSS tokens)

### Wishlist
- CSS subgrid layout matching collection pattern
- Detail panel rebuilt as `Modal` with editable fields
- Action buttons removed from rows; "Move to Collection" in detail panel footer
- Add to Wishlist modal: 4-section layout (search, priority, concentration, notes), conflict flagging

### Analytics
- Compliment time bucketing uses `c.month`/`c.year` fields (not `createdAt`)
- Hover tooltips on ranked rows
- Seasonal sections (winter/spring/summer/fall filter)
- `CompareView` component for side-by-side friend comparison
- Dynamic follows-based compare Select (not hardcoded)
- Stat cards always show user values regardless of compare state

### Compliments
- Accord + house MultiSelect filters
- Pagination with per-page control
- CSS grid layout (final: `max-content minmax(0,1fr) auto`)
- TopBar DB search with dropdown

### Design system / token editor
- Live token editor at `/admin/design`: click any token, edit, preview, publish to `globals.css` via `/patch-token` CF Function
- Reset control reverts to CSS default
- Sticky anchor nav with IntersectionObserver active state
- `--size-row-min`, `--color-navy-tint`, `--text-hero`, `--page-content-max-width` tokens defined

### UI components
- `Button`: outline-only primary, no filled navy; all variants correct
- `TabPill`: active = cream-dark bg + navy border; outline:none; selector variant added
- `Input` / `Textarea` / `Select`: canonical style — cream bg, meta-text border, radius-sm, accent focus
- `PageFilterBar`: reusable across collection, compliments, wishlist, analytics; `addLabel`/`onAdd` optional
- `SortControl`: ChevronDown in dropdown, ArrowUp/ArrowDown on direction button
- `Pagination`: legacy API (total/pageSize) + new API both supported
- `EmptyState`: used across friend, collection, dashboard
- `StatusBadge`: pill style (border + color, no fill)
- `FragranceProfileModal`: Add to Collection / Log Compliment flows
- `shortFragType()`: single source of truth for all list views
- `lib/tokens.ts` deleted; all values from CSS custom properties

### FAB actions
- edit-fragrance / change-status / remove-fragrance: fragrance picker overlay in layout.tsx
- edit-compliment / delete-compliment: compliment picker overlay
- add-fragrance: opens AddFragranceModal

### Voice input (bot drawer)
- SpeechRecognition API, listening state, confirmation card, modal prefill
- `createPendingTask` + `createPendingEntry` mutations wired

### Layout
- `ToastProvider` wraps modals (useToast no longer throws outside provider)
- `--page-margin` token drives equal page margins
- `PageContent` uses `--page-content-max-width: 1400px`
- Topbar: hamburger removed; no spurious props; page title only

### Other
- `purchase_date` in fragToDb serializer
- Settings page: all tokens, no legacy values
- Dashboard: fully migrated to design tokens + components
- Friend page: migrated, EmptyState, filter scope fixed
- `globals.css`: `--color-navy: #1e2d45` (had 5 correction commits; now stable)

---

## Commit Clusters (for context)

| Cluster | Commits | Theme |
|---------|---------|-------|
| Compliments column layout | ~25 commits | Iterated: static px → flex → subgrid → CSS grid max-content |
| FragranceCell layout | ~12 commits | Iterated: fixed 220px → auto-width → no-wrap → final inline style |
| Design system / token editor | ~20 commits | Live token editor built incrementally |
| Collection architecture | ~12 commits | tr/td → CSS grid → component extraction |
| `--color-navy` corrections | 6 commits | Repeated publish bugs; now stable at #1e2d45 |
| Social system | ~8 commits | Profiles, follows, social page, friend search |
| Admin dashboard | ~5 commits | Dynamic queries, pending tab, Dev Bot |
| Revert + fix | 2 commits | `29732a1` revert broke dupeFor + gap; `a864409` partially recovered |
