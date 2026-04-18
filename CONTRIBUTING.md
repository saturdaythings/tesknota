# Contributing

## Design System Rule

**Any token or component change requires a Design System page update in the same commit.**

- If you change a CSS token value in `globals.css` or `tokens.css`, update the token's entry in `app/(app)/admin/design/page.tsx`.
- If you change a shared component in `components/ui/`, update its `GalleryEntry` in the Components section of the Design System page.
- If you add a new token or component, add it to the Design System page before merging.

The Design System page at `/admin/design` is the canonical reference. A PR that modifies tokens or components without updating it will be blocked.
