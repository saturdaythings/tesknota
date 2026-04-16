@AGENTS.md

## Session Rules
- Extended thinking / adaptive reasoning: OFF.
- Load files on demand per task only. Skip AUDIT.md, CONTRIBUTING.md, tokens.css at startup.
- git log default: --oneline -10.
- Every 5 prompts: full audit. Otherwise scope reads to task files only.
- After each prompt: commit, push, deploy.

## Design System — Non-Negotiable Rules

These rules are enforced by the component layer. Violations must be corrected before committing.
Canonical reference: `STYLE_GUIDE.md`

### Required components (never bypass these)

| Need | Use | Never |
|------|-----|-------|
| Page container | `<PageContent>` from `components/layout/PageContent` | raw `<main>` with inline padding |
| Page header | `<Topbar>` from `components/layout/Topbar` | `<Header>` (deprecated) |
| Dropdown / select | `<Select>` from `components/ui/select` | native `<select>` |
| Text input | `<Input>` from `components/ui/input` | bare `<input>` |
| Button | `<Button variant="...">` from `components/ui/button` | bare `<button>` with inline styles |
| Filter pills | `<TabPill>` from `components/ui/tab-pill` | custom inline pill |

### Color — tokens only

Never hardcode a hex color or rgba value in a page or component.
Use `var(--color-navy)`, `var(--color-cream)`, `var(--color-accent)`, etc.
The only permitted raw rgba values are the three opacity variants already in STYLE_GUIDE.md:
`rgba(30,45,69,0.8)` (meta text), `rgba(30,45,69,0.7)` (notes text), `rgba(30,45,69,0.15)` (row dividers).

### Typography — no new sizes

Font sizes are defined in `globals.css` as `--text-*` tokens and in STYLE_GUIDE.md.
Do not introduce any font size not already in the table. Do not change font sizes at breakpoints.
Serif = italic only. Sans = upright only. Never swap their roles.

### Spacing — 4px grid tokens only

Use `var(--space-*)` tokens for padding and margin in layout code.
Do not hardcode `px`, `rem`, or `em` spacing values outside of component internals.

### Enforcement in practice

- New page → starts with `<Topbar title="..." />` + `<PageContent>...</PageContent>`. Nothing else.
- New dropdown → use `<Select>`. If options need custom rendering, extend `<Select>` — do not write a new one.
- Typography drift found → fix in the same PR, do not defer.
- Unknown value found (hex color, raw px, native element) → treat as a bug, fix immediately.
