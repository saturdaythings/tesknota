# Tesknota Style Guide

Canonical reference for all pages. Every new page, table, dropdown, button, and filter must
match these patterns exactly. The Compliments page is the source of truth — these rules
codify it precisely.

---

## Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--color-navy` | `#1E2D45` | Primary text, CTA bg, active states, borders |
| `--color-navy-mid` | `#3A5070` | Secondary text, muted content, dates |
| `--color-cream` | `#F5F0E8` | Page background, dropdown bg, button text on dark |
| `--color-cream-dark` | `#EAE3D8` | Cards, raised surfaces, badge bg, selected row |
| `--color-sand` | `#C8B89A` | Muted text, placeholder, chevron icons |
| `--color-sand-light` | `#D9CEBC` | Subtle borders, input borders at rest |
| Row divider | `rgba(30,45,69,0.15)` | Horizontal row separators |
| Meta text | `rgba(30,45,69,0.8)` | Relation, gender, location metadata |
| Notes text | `rgba(30,45,69,0.7)` | Italic note/quote text |
| Filter border (inactive) | `rgba(30,45,69,0.8)` | Inactive filter pill border |
| Row hover | `rgba(232,224,208,0.3)` | Row background on hover |
| Skeleton | `rgba(237,232,223,0.3)` | Loading skeleton rows |

---

## Typography

Two fonts only: **Cormorant Garamond** (serif, italic) and **Inter** (sans, upright).
Never mix their roles. No bold on serif. No italic on sans.

### Roles

| Role | Font | Style | Size | Weight | Tracking | Color |
|------|------|-------|------|--------|----------|-------|
| Fragrance name | Serif | italic | 20px | 400 | — | navy |
| Secondary name / layered | Serif | italic | 16px | 400 | — | navy |
| Notes / quote | Serif | italic | 16px | 400 | — | rgba(30,45,69,0.7), lh 1.6 |
| Page title | Serif | italic | 36px | 400 | — | navy |
| Empty state headline | Serif | italic | 22px | 400 | — | navy |
| House name | Sans | upright | 12px | 400 | 0.1em | navy |
| Meta (relation/location) | Sans | upright | 12px | 400 | — | rgba(30,45,69,0.8) |
| Date | Sans | upright | 12px | 400 | — | navy |
| Filter pill | Sans | upright uppercase | 12px | 400 | 0.08em | see below |
| Badge / label | Sans | upright uppercase | 11-13px | 500 | 0.1em | varies |
| Button | Sans | upright uppercase | 13px | 500 | 0.08em | cream on navy |
| Body copy | Sans | upright | 15px | 400 | — | navy |
| Small body / caption | Sans | upright | 14px | 400 | — | navy |
| Dropdown option | Sans | upright | 12px | 400 | — | navy |

**Rule:** Font size variation is intentional — do NOT introduce new sizes outside this table.
The contrast between 20px serif italic and 12px sans uppercase is the visual character of the app.

---

## Topbar

Component: `<Topbar>` from `components/layout/Topbar.tsx`

Used on every page. Replaces `<Header>` which is deprecated.

```
<Topbar
  title="Page Name"
  search={<SearchInput />}   {/* optional */}
  actions={<Button>...</Button>}  {/* optional */}
/>
```

| Property | Value |
|----------|-------|
| Height | `var(--header-height)` = 56px |
| Background | `var(--color-cream)` |
| Border | `1px solid var(--color-sand-light)` bottom |
| Horizontal padding | 18px mobile / 26px desktop |
| Breadcrumb: app label | 10px sans upright uppercase tracking-0.12em, color `var(--color-navy-mid)` |
| Breadcrumb: page title | 20px serif italic, color `var(--color-navy)`, lh 1.2 |
| Search slot | right of title, flex-shrink-0 |
| Actions slot | rightmost, gap-2 |
| Mobile hamburger | rendered left of title, hidden md |

Search input in topbar (dark bg context):
- 34px height, 200px width
- bg `rgba(255,255,255,0.08)`, border `rgba(255,255,255,0.15)`
- 13px sans, color `var(--color-cream)`
- border-radius 3px

---

## Page Layout

```tsx
<Topbar title="Page Name" />

<main style={{ flex: 1, overflowY: 'auto' }}>
  <div
    style={{ maxWidth: '1400px', margin: '0 auto', padding: 'var(--space-6) var(--space-8)' }}
    className="max-sm:px-[var(--space-4)] max-sm:py-[var(--space-4)]"
  >
    {/* Action row */}
    <div className="flex items-center justify-end mb-8">
      <Button variant="primary">Action Label</Button>
    </div>

    {/* Filter bar */}
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div className="flex flex-wrap gap-2">
        {/* TabPill components */}
      </div>
      <div style={{ width: '160px', flexShrink: 0, marginLeft: 'auto' }}>
        <Select ... />
      </div>
    </div>

    {/* Row list */}
    <div>
      {rows.map(...)}
    </div>
  </div>
</main>
```

| Property | Value |
|----------|-------|
| Horizontal padding (desktop) | `var(--space-8)` = 32px |
| Horizontal padding (mobile) | `var(--space-4)` = 16px |
| Vertical padding (desktop) | `var(--space-6)` = 24px |
| Vertical padding (mobile) | `var(--space-4)` = 16px |
| Max content width | 1400px, centered |
| Background | `var(--color-cream)` (from body default) |
| Below action row | `mb-8` = 32px |
| Below filter bar | `mb-6` = 24px |

**Button placement:** Primary action button sits in a right-aligned row inside `<main>`, above the filter bar. Do not place action buttons in the Topbar `actions` slot unless the page has no filter bar (e.g. Settings, Import).

---

## Primary Action Button

- Component: `<Button variant="primary">`
- Placement: right-aligned header row, above the filter bar
- Style: navy bg `#1E2D45`, cream text `#F5F0E8`, 13px Inter, tracking 0.08em, 3px radius, min-height 40px, px-4
- Hover: `var(--color-accent)` = `#2D4A6B`
- No icon in primary CTA unless explicitly designed

---

## Filter Pills (TabPill)

Component: `<TabPill>` from `components/ui/tab-pill.tsx`

```
font-sans uppercase 12px weight-400 tracking-0.08em
padding: 6px 12px
border-radius: 2px
```

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Active | `var(--color-navy)` | `var(--color-cream)` | `1px solid var(--color-navy)` |
| Inactive | transparent | `var(--color-navy)` | `1px solid rgba(30,45,69,0.8)` |
| Hover (inactive) | — | — | (handled by browser default; no custom needed) |

Count badge inside pill: 11px, opacity 0.8, same font.

Pills wrap at mobile widths. Gap between pills: 8px (`gap-2`).

---

## Sort Dropdown (Select)

Component: `<Select>` from `components/ui/select.tsx`

Container width: **160px**, flex-shrink 0, margin-left auto (right-aligns in filter bar).

| Element | Value |
|---------|-------|
| Trigger height | 36px (`h-9`) |
| Trigger padding | `px-3` (12px) |
| Trigger bg | `var(--color-cream)` |
| Trigger border (rest) | `1px solid rgba(30,45,69,0.8)` |
| Trigger border (open) | `1px solid var(--color-accent)` = `#2D4A6B` |
| Trigger font | 15px Sans (use `text-[12px]` className override on compliments) |
| Chevron color | `var(--color-sand)` |
| Dropdown bg | `var(--color-cream)` |
| Dropdown border | `1px solid rgba(30,45,69,0.8)` |
| Dropdown radius | 3px |
| Dropdown shadow | `0 4px 16px rgba(0,0,0,0.12)` |
| Dropdown top offset | `calc(100% + 4px)` |
| Option height | 36px |
| Option padding | `0 12px` |
| Option font | 12px Sans navy |
| Option selected bg | `var(--color-cream-dark)` |
| Option hover bg | `rgba(232,224,208,0.3)` |

On mobile (`max-sm`): dropdown becomes `width: 100%`.

---

## Row List (Table Pattern)

No `<table>` element. Use flexbox rows with `border-bottom`.

### Row anatomy

```
<div flex gap-6 items-start cursor-pointer
     style="min-height:80px; padding:16px 0; border-bottom:1px solid rgba(30,45,69,0.15)"
     onHover: bg rgba(232,224,208,0.3)>

  <FragranceCell flex-1 min-w-0 />        {/* Column 1 */}

  <div flex-1 min-w-0>                     {/* Column 2: meta + notes */}
    <div sans 12px rgba(30,45,69,0.8)>     {/* RELATION · GENDER · LOCATION */}
    <div serif italic 16px rgba(30,45,69,0.7) lh-1.6>  {/* notes */}
  </div>

  <div sans 12px navy flex-shrink-0 text-right min-w-[72px]>  {/* Column 3: date */}

</div>
```

| Property | Value |
|----------|-------|
| Row min-height | 80px |
| Row padding | 16px top/bottom, 0 left/right |
| Row border | `1px solid rgba(30,45,69,0.15)` bottom only |
| Column gap | 24px (`gap-6`) |
| Hover bg | `rgba(232,224,208,0.3)` (inline style, not class) |
| Between name line and house | 4px (`mb-1`) |
| Between meta and notes | 4px (`mb-1`) |

---

## FragranceCell (Column 1)

Component: `<FragranceCell>` from `components/ui/fragrance-cell.tsx`

The canonical first column for any list row showing a fragrance entry.
Use this on Compliments, Collection, Wishlist, and any future list page.

```
Line 1: [FragName: serif italic 20px navy lh-1.2]
         [TypeBadge: neutral 11px if present]
         [+ Secondary: serif italic 15px navy if present]

Line 2: [House: sans uppercase tracking-0.1em 12px navy if present]
```

Props: `name`, `house?`, `type?` (FragranceType), `secondary?`

---

## Date Display

Format: `MMM YYYY` in all-caps — `APR 2025`, `JAN 2024`

Placed in a right-aligned column: 12px sans navy, min-width 72px, `text-right`, `flex-shrink-0`.

Source: prefer `createdAt` timestamp, fall back to `year`+`month` fields.

---

## Meta Line

Format: `RELATION · GENDER · LOCATION` — all uppercase, dot-space separated.

Typography: 12px sans, `rgba(30,45,69,0.8)`, no tracking override.

---

## Empty State

```
<div flex flex-col items-center justify-center py-24 text-center>
  <Icon size=40 navy mb-4 />
  <div serif italic 22px navy mb-2>No items yet</div>
  <div sans 14px navy max-w-[280px] mb-6>Supporting copy.</div>
  <Button variant="primary">Primary Action</Button>
</div>
```

---

## Loading Skeleton

Replace rows with blank divs:

```
height: 80px
border-bottom: 1px solid rgba(30,45,69,0.15)
background: rgba(237,232,223,0.3)
border-radius: 3px
margin-bottom: 2px
```

---

## Responsive Rules

| Breakpoint | Change |
|-----------|--------|
| `max-sm` (< 640px) | Row columns stack: `flex-col gap-2` instead of `flex-row gap-6` |
| `max-sm` | Filter bar: `flex-col` stacking |
| `max-sm` | Sort dropdown: `width: 100%`, `margin-top: 12px` |
| All | Font sizes do NOT change at any breakpoint |
| All | Padding halves: 20px mobile, 40px desktop |

---

## Spacing Reference (4px grid)

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |

Common Tailwind shorthand: `gap-2`=8px, `gap-4`=16px, `gap-6`=24px, `mb-1`=4px, `mb-2`=8px, `mb-6`=24px, `mb-8`=32px, `py-8`=32px, `px-5`=20px, `px-10`=40px.

---

## Border Radius

| Context | Value |
|---------|-------|
| Buttons, dropdowns, cards | 3px |
| Filter pills | 2px |
| Search inputs, text inputs in modals | 2px |
| Badges | 2px |
| Tag pills | 9999px (full round) |
| Modal panel | 6px (no bottom radius on mobile bottom sheet) |
| Row hover | no radius |

---

## Search Input

Used in: page topbar, modal fragrance search, any typeahead. Same spec everywhere.

```
<div className="relative">
  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(30,45,69,0.8)' }} />
  <input
    className="w-full h-9 pl-9 pr-3 rounded-[2px] font-sans outline-none
               transition-[border-color] duration-150
               focus:border-[var(--color-accent)]
               placeholder:text-[var(--color-navy-mid)]"
    style={{
      fontSize: '12px', fontWeight: 400, letterSpacing: '0.08em',
      background: 'var(--color-cream)',
      border: '1px solid rgba(30,45,69,0.8)',
      color: 'rgba(30,45,69,0.8)',
    }}
  />
</div>
```

| Property | Value |
|----------|-------|
| Height | 36px (`h-9`) |
| Left padding | 36px (`pl-9`) — reserved for icon |
| Right padding | 12px (`pr-3`) |
| Icon | `<Search size={15}>`, color `rgba(30,45,69,0.8)`, absolute left-3 vertically centered |
| Border radius | 2px |
| Font | 12px sans, weight 400, tracking `0.08em` |
| Text color (empty) | `rgba(30,45,69,0.8)` |
| Text color (filled) | `var(--color-navy)` — switches when user types or selects |
| Placeholder color | `var(--color-navy-mid)` |
| Border (rest) | `1px solid rgba(30,45,69,0.8)` |
| Border (focus) | `1px solid var(--color-accent)` |
| Border (error) | `1px solid var(--color-destructive)` |
| Background | `var(--color-cream)` |

### Search autocomplete dropdown

Appears below input at `calc(100% + 4px)`. Same dropdown shell as `<Select>`.

| Property | Value |
|----------|-------|
| Background | `var(--color-cream)` |
| Border | `1px solid rgba(30,45,69,0.8)` |
| Border radius | 3px |
| Shadow | `0 4px 16px rgba(0,0,0,0.12)` |
| Max height | 220px, overflow-y auto |
| Row height | 48px |
| Row padding | `0 12px` |
| Row divider | `1px solid rgba(30,45,69,0.1)` bottom |
| Row hover bg | `rgba(232,224,208,0.3)` |
| Result name | 18px serif italic navy, lh 1.2 |
| Result house | 12px sans uppercase tracking-0.1em navy |

---

## Modal / Add Popup

Components: `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` from `components/ui/modal.tsx`

Use for all add, edit, log, and confirm flows — "Log Compliment", "Add to Collection", "Add to Wishlist", etc.

### Shell

```tsx
<Modal open={open} onClose={onClose}>
  <ModalHeader title="Log a Compliment" onClose={onClose} />
  <ModalBody>
    ...form fields...
  </ModalBody>
  <ModalFooter>
    ...action buttons...
  </ModalFooter>
</Modal>
```

| Property | Value |
|----------|-------|
| Desktop size | 90vw, max-w 560px, max-h 90dvh, centered |
| Mobile | Full-width bottom sheet, max-h 90dvh, no bottom radius |
| Background | `var(--color-cream)` |
| Border radius | 6px (0px bottom on mobile) |
| Shadow | `0 8px 32px rgba(0,0,0,0.2)` |
| Backdrop | `rgba(30,45,69,0.6)` |
| Header padding | `px-8 py-6` |
| Body padding | `px-8 py-6` |
| Footer padding | `px-8 py-4` |
| Header title | 22px serif italic navy |
| Header close button | `<Button variant="icon">` with X icon |
| Header/footer dividers | `1px solid var(--color-cream-dark)` |

### Form layout

```
<ModalBody>
  <div className="flex flex-col gap-5">   {/* 20px between every field group */}
    <div>
      <FieldLabel>Label <RequiredMark /></FieldLabel>
      <Input ... />
    </div>
    <div>
      <FieldLabel>Label <OptionalTag /></FieldLabel>
      <Input ... />
    </div>
    {/* 2-column grid for paired fields */}
    <div className="grid grid-cols-2 gap-4">
      ...
    </div>
  </div>
</ModalBody>
```

| Property | Value |
|----------|-------|
| Field gap | 20px (`gap-5`) between every field group |
| Paired fields | `grid grid-cols-2 gap-4` (16px between) |
| Sub-fields under one label | `flex flex-col gap-2` (8px between) |

### Field label

Component: `<FieldLabel>` from `components/ui/field-label.tsx`

```tsx
<FieldLabel>Label text <RequiredMark /></FieldLabel>
<FieldLabel>Label text <OptionalTag /></FieldLabel>
```

| Element | Size | Weight | Style | Color |
|---------|------|--------|-------|-------|
| FieldLabel | 11px | 500 | sans uppercase tracking-0.1em | navy |
| OptionalTag "(optional)" | 13px | 400 | normal-case | `rgba(30,45,69,0.7)` |
| RequiredMark "*" | 13px | 400 | normal-case | `var(--color-destructive)` |

### Text inputs

All open-text form inputs use the same spec as the search input — same size, tracking, color, radius.

```tsx
<input
  className="w-full h-9 px-3 rounded-[2px] font-sans outline-none
             transition-[border-color] duration-150
             focus:border-[var(--color-accent)]
             placeholder:text-[var(--color-navy-mid)]"
  style={{
    fontSize: '12px', fontWeight: 400, letterSpacing: '0.08em',
    background: 'var(--color-cream)',
    border: '1px solid rgba(30,45,69,0.8)',
    color: 'rgba(30,45,69,0.8)',
  }}
/>
```

### Textarea

Same spec as text input. Fixed height (no resize), max 160 characters for short capture fields.

```tsx
<textarea
  rows={3}
  maxLength={160}
  className="w-full p-3 rounded-[2px] font-sans outline-none resize-none
             transition-[border-color] focus:border-[var(--color-accent)]
             placeholder:text-[var(--color-navy-mid)]"
  style={{
    fontSize: '12px', fontWeight: 400, letterSpacing: '0.08em',
    minHeight: '72px',
    background: 'var(--color-cream)',
    border: '1px solid rgba(30,45,69,0.8)',
    color: 'rgba(30,45,69,0.8)',
  }}
/>
```

Notes displayed in list rows: `line-clamp-2` (max 2 visible lines in the row).

### Select dropdowns in modals

Use `<Select>` component. Same component as the page-level sort dropdown. Width fills its grid column.

### Toggle groups (option pickers)

Use `<TabPill>` components in a `flex flex-wrap gap-2` wrapper. Same pill spec as page filter pills.

```tsx
<div className="flex flex-wrap gap-2">
  {options.map((opt) => (
    <TabPill key={opt.value} label={opt.label} active={value === opt.value} onClick={() => onChange(opt.value)} />
  ))}
</div>
```

### Footer buttons

```tsx
<ModalFooter>
  <div className="flex items-center gap-3 flex-1">
    {/* destructive actions (delete) go left */}
  </div>
  <div className="flex items-center gap-3">
    <Button variant="secondary" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={save}>Log / Save</Button>
  </div>
</ModalFooter>
```

Primary CTA label: "Log [Thing]" for new entries, "Save Changes" for edits.
Cancel always secondary. Delete always destructive, left-aligned with a confirm step.

---

## Do Not

- Do not use `<Header>` — deprecated. Use `<Topbar>` on all pages
- Do not write a raw `<main>` tag in pages — use `<PageContent>` from `components/layout/PageContent`
- Do not use `<table>` for fragrance/compliment row lists
- Do not change font sizes at breakpoints
- Do not use `<select>` (native) anywhere visible to the user — always `<Select>` component
- Do not use bold weight on serif text
- Do not use italic on sans text
- Do not add box shadows to rows or filter pills
- Do not use color outside the palette above
- Do not use `border-radius` > 3px on interactive controls
