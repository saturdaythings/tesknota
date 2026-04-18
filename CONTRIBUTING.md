# Contributing

## Design System Rule

**Any token or component change requires a Design System page update in the same commit.**

- If you change a CSS token value in `globals.css`, update the token's entry in `app/(app)/admin/design/page.tsx`.
- If you change a shared component in `components/ui/`, update its `GalleryEntry` in the Components section of the Design System page.
- If you add a new token or component, add it to the Design System page before merging.

The Design System page at `/admin/design` is the canonical reference. A PR that modifies tokens or components without updating it will be blocked.

## Build-Time Validation

The build runs automated checks to enforce design system compliance:

### Component Gallery Check
All shared components in `components/ui/` must be documented in the Component Gallery (GALLERY_ITEMS array in `app/(app)/admin/design/page.tsx`). The following components currently need documentation:

- `modal` — Dialog component with backdrop and ARIA attributes
- `multi-select` — Dropdown with multi-selection support
- `per-page-control` — Pagination size selector buttons

**Guidance:** Add these components to GALLERY_ITEMS with brief examples showing all variants and usage patterns.

### Token Definition Check
All CSS tokens used in component files must be defined in `globals.css`. The validation script scans for `var(--*)` usage and ensures all referenced tokens exist.

**Guidance:** If you use a new token, define it in `globals.css` before using it in components.

### Hardcoded Value Check
Hardcoded color hex values, font sizes, and spacing values in component files are flagged. All design values should use CSS tokens.

**Guidance:**
- Colors → use `var(--color-*)`
- Font sizes → use `var(--text-*)`
- Spacing (padding, margin, gap) → use `var(--space-*)`
- Exceptions: acceptable rgba values (`rgba(30,45,69,0.*)`) are permitted for opacity variants documented in globals.css

### Running Validation Manually
```bash
node scripts/validate-design-system.js
```

The build process automatically runs this check. Fix validation errors before pushing.
