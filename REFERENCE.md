# Compliments — Reference Implementation

This file documents the Compliments section as the canonical design and architecture standard.
Every subsequent page migration must match these patterns where the same pattern applies.

---

## File map

| File | Role |
|---|---|
| `app/(app)/compliments/page.tsx` | Page shell — data, state, column definitions |
| `components/compliments/compliments-list.tsx` | Table grid + rows |
| `components/compliments/compliment-filters.tsx` | Filter/sort bar |
| `components/compliments/empty-compliments.tsx` | Empty state |
| `components/compliments/log-compliment-modal.tsx` | Add/edit modal |

---

## Page shell pattern (`page.tsx`)

- `"use client"` directive on every client file.
- `COLUMNS` defined at module level as a `const` array — never inside the component.
- All `useState`, `useMemo`, `useEffect` hooks appear before any early return.
- Single early return: `if (!user) return null;` — only after all hooks.
- Local skeleton: named function `function XxxSkeleton()` at module scope, after the inner component.
- Suspense boundary: `export default function XxxPage() { return <Suspense><XxxInner /></Suspense>; }`
- Layout: `<Topbar title="..." actions={...} />` then `<PageContent>...</PageContent>` — nothing else at root.
- Action button row: `<div className="flex items-center justify-end mb-8">`.

---

## Table grid pattern (`compliments-list.tsx`)

```
<div style={{ display: 'grid', gridTemplateColumns, columnGap: 'var(--space-10)' }}>
  {items.map(item => <Row key={item.id} ... />)}
</div>
```

- One grid wraps all rows. No header row in Compliments (collection adds one — that is permitted).
- Each row: `display: 'grid'; gridTemplateColumns: 'subgrid'; gridColumn: '1 / -1'`.
- Row `minHeight`: component-internal constant (not a token) with `/* component-internal */` comment.
- Row padding: `padding: 'var(--space-4) 0'` — vertical only, applied to the row div, not cells.
- Row divider: `borderBottom: '1px solid var(--color-row-divider)'`.
- Row hover: `onMouseEnter` sets `background = 'var(--color-row-hover)'`; `onMouseLeave` resets to `'transparent'`.
- Cell containers: `style={{ minWidth: 0, textAlign: col.align ?? 'left' }}` — no padding on cells.
- Pagination: `<Pagination page={page} totalPages={totalPages} onPage={onPage} />` immediately after the grid.

---

## Typography in rows

| Content | Font | Size | Weight | Spacing | Color |
|---|---|---|---|---|---|
| Meta / label line | `font-sans uppercase` | `var(--text-xs)` | `var(--font-weight-normal)` | `var(--tracking-md)` | `var(--color-navy)` |
| Notes / body | `font-serif italic` | `var(--text-note)` | — | — | `var(--color-meta-text)` |
| Notes line-height | — | — | — | — | `var(--leading-relaxed)` |
| Date / right-aligned | `font-sans uppercase` | `var(--text-xs)` | — | `var(--tracking-md)` | `var(--color-navy)` |
| Table header | `font-sans uppercase` | `var(--text-xxs)` | `var(--font-weight-medium)` | `var(--tracking-md)` | `var(--color-navy)` |

---

## Filter bar pattern (`compliment-filters.tsx`)

- Outer wrapper: `style={{ marginBottom: 'var(--space-6)' }}`.
- Inner row: `className="flex items-start justify-between gap-4 flex-wrap max-sm:flex-col"`, `style={{ marginBottom: 'var(--space-3)' }}`.
- Tab pills: `className="flex flex-wrap gap-2"`, each pill is `<TabPill>` from design system.
- Per-page control: right side, `style={{ flexShrink: 0 }}`, always `<PerPageControl>`.
- Sort dropdown: `<Select options={...} value={sort} onChange={onSort} size="auto" />` — `size="auto"` shrinks to longest label.
- No search input in the filter bar (search belongs in the header action row if needed).

---

## Empty state pattern (`empty-compliments.tsx`)

```tsx
<div className="flex flex-col items-center justify-center py-24 text-center">
  <Icon style={{ color: 'var(--color-navy)', marginBottom: 'var(--space-4)' }} />
  <div className="font-serif italic mb-2"
    style={{ fontSize: 'var(--text-empty-title)', color: 'var(--color-navy)' }}>
    Title
  </div>
  <div className="font-sans mb-6"
    style={{ fontSize: 'var(--text-ui)', color: 'var(--color-navy)', maxWidth: DESCRIPTION_MAX_WIDTH }}>
    Description
  </div>
  <Button variant="primary" onClick={onAdd}>CTA</Button>
</div>
```

- `maxWidth` on description: component-internal constant with `/* component-internal */` comment.
- Never a bare `<button>` — always `<Button variant="...">`.

---

## Modal pattern (`log-compliment-modal.tsx`)

- `<Modal>`, `<ModalHeader>`, `<ModalBody>`, `<ModalFooter>` — always all four.
- `<FieldLabel>`, `<RequiredMark>`, `<OptionalTag>` for form labels.
- `<Select>` for all single-select dropdowns. Never native `<select>`.
- `<TabPill>` groups (via `ToggleGroup`) for mutually exclusive choice sets.
- `<Button variant="destructive">` for delete; `<Button variant="ghost">` for cancel/secondary.
- Inline `<input>` and `<textarea>` are used inside modals for freeform text — acceptable within modal internals, not on pages or filter components.

---

## Design system components — required usage

| Need | Component | Never |
|---|---|---|
| Page container | `<PageContent>` | raw `<main>` |
| Page header | `<Topbar>` | anything else |
| Fragrance name + house | `<FragranceCell>` | inline name/house divs |
| Single-select dropdown | `<Select>` | native `<select>` or bare `<button>` dropdowns |
| Multi-select dropdown | `<MultiSelect>` | custom inline multi-select |
| Tab filter pills | `<TabPill>` | bare styled buttons |
| Per-page selector | `<PerPageControl>` | custom impl |
| Pagination | `<Pagination>` | custom impl |
| Any button | `<Button variant="...">` | bare `<button>` with inline styles on pages/filters |
| Modal | `<Modal>` + header/body/footer | custom overlay divs |
| Text input (page/filter) | `<Input>` | bare `<input>` |

---

## Token reference

### Colors
| Token | Value | Use |
|---|---|---|
| `var(--color-navy)` | `#1e2d45` | Primary text, icons |
| `var(--color-meta-text)` | `rgba(30,45,69,0.80)` | Secondary/meta text |
| `var(--color-notes-text)` | `rgba(30,45,69,0.70)` | Notes body |
| `var(--color-row-divider)` | `rgba(30,45,69,0.15)` | Row borders |
| `var(--color-row-hover)` | `rgba(232,224,208,0.30)` | Row hover background |
| `var(--color-cream-dark)` | `#EAE3D8` | Raised surfaces, header bg |
| `var(--color-accent)` | `#2D4A6B` | Active indicators, links |
| `var(--color-destructive)` | `#8B1A1A` | Error, delete |
| `var(--color-sand-light)` | `#D9CEBC` | Borders (non-row), tags |

### Spacing
| Token | px | Primary use |
|---|---|---|
| `var(--space-half)` | 2px | Tight micro-gaps |
| `var(--space-1)` | 4px | Icon gaps, tiny padding |
| `var(--space-2)` | 8px | Small gaps |
| `var(--space-3)` | 12px | Filter inner spacing |
| `var(--space-4)` | 16px | Standard block padding/margin |
| `var(--space-5)` | 20px | Modal section gap |
| `var(--space-6)` | 24px | Filter bar outer margin |
| `var(--space-8)` | 32px | Section gaps |
| `var(--space-10)` | 40px | Table column gap |
| `var(--space-12)` | 48px | — |
| `var(--space-16)` | 64px | Row min-height (token form) |

### Font sizes
| Token | px | Use |
|---|---|---|
| `var(--text-xxs)` | 10px | Table headers |
| `var(--text-label)` | 11px | Small labels |
| `var(--text-xs)` | 12px | Meta text, uppercase labels |
| `var(--text-sm)` | 13px | Body text in modals |
| `var(--text-ui)` | 14px | Description text |
| `var(--text-base)` | 15px | Standard body |
| `var(--text-note)` | 16px | Notes body |
| `var(--text-empty-title)` | 22px | Empty state heading |
| `var(--text-page-title)` | 24px | Page titles |

### Size scale (component-internal sentinel tokens)
| Token | px | Use |
|---|---|---|
| `var(--size-row-min)` | 80px | Row/card min-height |
| `var(--size-dropdown-max)` | 280px | Dropdown/panel max-height |

### Other
| Token | Value |
|---|---|
| `var(--tracking-md)` | 0.10em — standard uppercase tracking |
| `var(--leading-relaxed)` | 1.6 — notes line height |
| `var(--font-weight-normal)` | 400 |
| `var(--font-weight-medium)` | 500 |
| `var(--radius-md)` | 3px |
| `var(--shadow-md)` | `0 4px 16px rgba(0,0,0,0.12)` |

### Permitted raw rgba values (STYLE_GUIDE.md)
Only these three may appear as raw rgba() in source:
- `rgba(30,45,69,0.8)` — meta text (prefer `var(--color-meta-text)`)
- `rgba(30,45,69,0.7)` — notes text (prefer `var(--color-notes-text)`)
- `rgba(30,45,69,0.15)` — row dividers (prefer `var(--color-row-divider)`)

---

## Skeleton pattern

```tsx
/* component-internal: skeleton row height */
const SKELETON_ROW_HEIGHT = 'var(--size-row-min)';

function XxxSkeleton() {
  return (
    <div>
      {Array.from({ length: N }).map((_, i) => (
        <div key={i} style={{
          height: SKELETON_ROW_HEIGHT,
          borderBottom: '1px solid var(--color-row-divider)',
          background: 'var(--color-row-hover)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-1)',
        }} />
      ))}
    </div>
  );
}
```
