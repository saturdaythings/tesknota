# Migration History

The original vanilla JS app was fully rewritten in Next.js 15. Migration completed and deployed to tesknota.pages.dev. The original vanilla JS codebase no longer exists as a separate repo.

## Data migration (completed)

- 455 community fragrances from Google Sheets `fragranceDB` tab
- 93 user fragrances (Kiana + Sylvia) from `userFragrances` tab
- 16 compliments from `userCompliments` tab

All data is now in Supabase. Google Sheets is no longer used.

## Key decisions

- **Deduplication**: fragrances unique on `(name_normalized, house_normalized, type)`. Different concentrations (EDP, EDT, Extrait, Body Spray) are distinct products — never merged.
- **Auth**: Supabase email+password. Users: Kiana and Sylvia.
- **Hosting**: Cloudflare Pages (static export). Repo: `oliver-chase/tesknota`.
- **Month format**: stored as numeric "01"-"12" throughout (comp-form and cmd-palette both use this format).
