# tesknota

Fragrance journal for Kiana and Sylvia. Live at **tesknota.pages.dev**.

## Stack

- **Framework**: Next.js 15 App Router + TypeScript (static export)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Auth + DB**: Supabase (email+password auth, Postgres with RLS)
- **Hosting**: Cloudflare Pages (`out/` static build)

## Dev

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to out/
```

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

See `ARCHITECTURE.md` for file map, data models, and design token reference.

## Deployment

Push to `main` on `oliver-chase/tesknota`. Cloudflare Pages picks it up automatically and deploys to tesknota.pages.dev.

Build command: `npm run build`
Output directory: `out/`
