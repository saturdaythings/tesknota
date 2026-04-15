# Visual Audit: Next.js vs. Reference (live vanilla JS)

Reference screenshots are in `design-reference/`. The live site captured is the
vanilla JS SPA at tesknota.pages.dev (rolled back). The Next.js codebase being
audited is the current state of `~/projects/tesknota`.

Severity scale: **CRITICAL** (broken/missing feature), **MAJOR** (visible gap), **MINOR** (cosmetic).
Status key: [x] = fixed, [ ] = pending.

---

## 1. Sidebar

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| S1 | MINOR [x] | Subtitle text differs | "FRAGRANCE TRACKER" (uppercase mono) | Fixed: "Fragrance Tracker" |
| S2 | MINOR [x] | Tagline present in Next.js but absent in reference | None | Fixed: removed |
| S3 | MINOR | Nav section headers present in Next.js; reference has flat list with no headers | No section groups | "My Space", "Experiences", "Social", "Manage" groups — `app/(app)/layout.tsx:26-66` |
| S4 | MINOR | Nav items use `<Link>` in Next.js; reference uses `div.sb-link[data-page]` | DOM-navigated divs | `<Link href>` — `Sidebar.tsx:82` |

---

## 2. Topbar

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| T1 | MINOR [x] | Topbar shows stacked category + title; reference shows only the page title | Single serif title only | Fixed: category prop removed from interface + all callers |

---

## 3. Dashboard

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| D1 | MINOR | DQBanner ("X fragrances are missing rating") is new; not in reference | Absent | `DQBanner` component — `dashboard/page.tsx:162-191` |
| D2 | MATCH | 4-stat row (Collection / Compliments / Wishlist / Avg Rating) | Matches | `dashboard/page.tsx:100-105` |
| D3 | MATCH | "Signature spotlight" card | Matches | `dashboard/page.tsx:210-228` |
| D4 | MATCH | "Scent signature" accord cloud | Matches | `dashboard/page.tsx:260-265` |
| D5 | MATCH | "Recently added" table (desktop) / cards (mobile) | Matches | `dashboard/page.tsx:283-329` |
| D6 | MATCH | Friend activity cards | Matches | `dashboard/page.tsx:414-486` |

---

## 4. Collection

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| C1 | MAJOR | Filter bar always visible in Next.js; reference has collapsed "+ FILTERS" toggle | Collapsed, expands on click | `FilterBar` always rendered — `collection/page.tsx:141` |
| C2 | MAJOR | Reference has 4 filter dropdowns: Accords, Rating, Houses, plus status chips; Next.js has status chips only | Accords / Rating / Houses dropdowns | No such dropdowns — `collection/page.tsx:141-150` |
| C3 | MINOR [x] | Add button label | Fixed: "+ Add to Collection" |
| C4 | MINOR | Sort is a native `<select>` in both; labels match ✓ | Matches | `collection/page.tsx:126-138` |
| C5 | MAJOR | Mobile: collection uses scrolling table (`overflow-x-auto`); reference shows card-per-row layout on mobile | Card layout on mobile | `collection/page.tsx:185` — no mobile card fallback (compare `dashboard/page.tsx:320-325` which does have one) |
| C6 | MATCH | 3-stat row (Total / Current / Avg Rating) | Matches | `collection/page.tsx:112-116` |

---

## 5. Wishlist

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| W1 | MINOR [x] | Add button label | Fixed: "+ Add to Wishlist" |
| W2 | MATCH | Filter chips (All / Want to Buy / Want to Smell) | Matches | `wishlist/page.tsx:123-132` |
| W3 | MATCH | Search input above filter chips | Matches | `wishlist/page.tsx:114-121` |
| W4 | MATCH | Sort dropdown | Matches | `wishlist/page.tsx:133-142` |
| W5 | MATCH | Discover section (friend frags + highly rated) | Matches | `wishlist/page.tsx:204-241` |

---

## 6. Compliments

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| CP1 | MINOR [x] | Log button label | Fixed: "+ Log Compliment" |
| CP2 | MATCH | Relation filter chips | Matches | `compliments/page.tsx:81-90` |
| CP3 | MATCH | Table columns (Fragrance / Relation / When / Location) | Matches | `compliments/page.tsx:127-129` |
| CP4 | MATCH | 3-stat row (Total / Year / This Month) | Matches | `compliments/page.tsx:75-79` |

---

## 7. Add Fragrance Modal (frag-form)

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| F1 | MAJOR [x] | Step 1 community data preview | Fixed: accord chips + top/mid/base notes + rating shown after selecting match |
| F2 | MAJOR [x] | Step 2 collapsible "More Details" | Fixed: where bought/date/price/notes/dupe hidden behind toggle; edit mode auto-opens |
| F3 | MINOR [x] | Status field native select → chips | Fixed |
| F4 | MINOR [x] | Concentration field native select → chips | Fixed |
| F5 | MINOR [x] | Button labels | Fixed: "Save Fragrance" |
| F6 | MINOR [x] | Step subtitle | Fixed: removed |

---

## 8. Log Compliment Modal (comp-form)

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| LC1 | CRITICAL [x] | Layering fragrance picker missing | Fixed: secondary frag search/picker added, wired to secondaryFragId/secondaryFrag on save |
| LC2 | MINOR [x] | Modal title casing | Fixed |
| LC3 | MINOR [x] | Gender label | Fixed: "Gender" |
| LC4 | MATCH | Relation chips | Matches | `comp-form.tsx:274-289` |
| LC5 | MATCH | Month/Year selectors | Matches | `comp-form.tsx:318-345` |
| LC6 | MATCH | Location fields (venue / city / country) | Matches | `comp-form.tsx:347-372` |

---

## 9. Import Page

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| I1 | CRITICAL | Reference has 3 tabs: "Paste a Link", "Scan a Bottle", "CSV"; Next.js has 2 tabs: "Search Database", "Import File" | 3 tabs | `import/page.tsx:595-617` — `ImportTabId = "search" | "csv"` |
| I2 | CRITICAL | "Paste a Link" tab (paste Fragrantica/Parfumo URL, scrape community data) absent | Present in reference | Not implemented |
| I3 | CRITICAL | "Scan a Bottle" tab (camera/barcode scan to identify fragrance) absent | Present in reference | Not implemented |
| I4 | MATCH | "Import File" tab (XLSX/CSV upload with template download) | Reference "CSV" tab roughly matches; Next.js version is richer (template, community data) | `import/page.tsx:263-486` |
| I5 | MATCH | "Search Database" tab searches community frags and adds directly | Reference equivalent is inline search | `import/page.tsx:492-591` |

---

## 10. Analytics

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| A1 | MAJOR | Reference shows horizontal bar charts for top fragrances by compliment count; Next.js shows plain table | Visual bar chart | `analytics/page.tsx:116-145` — `<table>` only |
| A2 | MAJOR | Reference shows a "By Month" time-series bar chart (compliments per month); Next.js has no time axis | Monthly chart | Absent entirely from `analytics/page.tsx` |
| A3 | MAJOR | Reference shows a donut/ring chart for status breakdown; Next.js uses StatBox grid (numbers only) | Visual donut chart | `analytics/page.tsx:213-220` — `<StatsGrid>` of numbers |
| A4 | MINOR | Next.js has tab toggle (Compliments / Collection); reference single-page with all sections stacked | Single page | `analytics/page.tsx:49-52` — tab UI |
| A5 | MATCH | Accord cloud (compliment-worn frags) | Matches | `analytics/page.tsx:157-169` |
| A6 | MATCH | By Relation stat boxes | Matches | `analytics/page.tsx:148-155` |

---

## 11. Friend Profile

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| FP1 | MAJOR | Reference shows friend's collection as a card/grid layout; Next.js uses table with tabs | Card grid | `friend/page.tsx:162-189` — table layout |
| FP2 | MAJOR | Reference shows friend's "scent signature" accord cloud on their profile; Next.js has no accord cloud | Accord cloud section | Absent from `friend/page.tsx` |
| FP3 | MINOR | Next.js has "In Common" tab not in reference | "In Common" tab is new | `friend/page.tsx:16-23` |
| FP4 | MATCH | Stats row (Collection / Compliments / Wishlist) | Matches (Next.js adds In Common stat) | `friend/page.tsx:77-80` |
| FP5 | MATCH | Compliments tab | Matches | `friend/page.tsx:203-273` |

---

## 12. Mobile (390px viewport)

| # | Severity | Gap | Reference | Next.js location |
|---|----------|-----|-----------|-----------------|
| M1 | MATCH | Hamburger menu + sidebar drawer | Matches | `Topbar.tsx:32-40`, `Sidebar.tsx:39-55` |
| M2 | MAJOR | Mobile collection: reference renders stacked cards; Next.js renders horizontal-scroll table | Card layout | `collection/page.tsx:185` — no mobile card path |
| M3 | MATCH | Mobile dashboard: stat boxes wrap, cards stack | Matches | `dashboard/page.tsx:320-325` has mobile card path |
| M4 | MATCH | Mobile sidebar backdrop | Matches | `Sidebar.tsx:39-45` |

---

## Summary by Priority

### CRITICAL (must fix before parity claim)
- `LC1` — Layering fragrance field missing from comp-form
- `I1/I2/I3` — Import tabs "Paste a Link" and "Scan a Bottle" not implemented

### MAJOR (significant visual/functional gaps)
- `C1/C2` — Collection filter bar: always visible + missing Accords/Rating/Houses dropdowns
- `C5` — Collection mobile: no card layout fallback
- `F1` — Frag form step 1: no community data preview (accords/notes) after selecting
- `F2` — Frag form step 2: no collapsible "more details" expander
- `A1/A2/A3` — Analytics: no bar charts, no monthly time-series, no status donut
- `FP1/FP2` — Friend page: table vs. cards, missing accord cloud
- `M2` — Mobile collection: horizontal scroll table instead of card layout

### MINOR (cosmetic / label differences)
- `S1/S2/S3` — Sidebar: subtitle text, tagline, section headers
- `T1` — Topbar: category breadcrumb not in reference
- `C3` — Add button labels (lowercase vs. uppercase)
- `F3/F4/F5/F6` — Frag form: native selects vs. chips, button casing, subtitle
- `LC2/LC3` — Comp form: modal title casing, gender label
- `W1/CP1` — Add/log button labels
