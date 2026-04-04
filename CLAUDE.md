# tesknota — Agent Instructions

Private 2-user fragrance tracker for Kiana (u1) and Sylvia (u2).
Git repo: `saturdaythings/tesknota`. ALWAYS commit and push after every change.

## Stack

Single `index.html`, vanilla JS, Google Sheets backend, Cloudflare Pages. No frameworks, no npm.

## Hard constraints

- All changes go to `index.html` only
- No frameworks, libraries, or npm packages
- No new modal fields without asking first
- No hardcoded years, user IDs, or counts
- No `click` listeners on dropdown items — use `mousedown + preventDefault`
- Mobile-first (iPhone Safari). Two users only, no scale.

## Google Sheets tabs & linking

The fragranceDB tab is the bridge between community data and user data.
**fragranceId is the primary key** that links all three data tabs:

```
userFragrances.fragranceId <-> fragranceDB.fragranceId <-> userCompliments.primaryFragranceId
```

- `fragranceDB` — auto-generated from FRAG_DB array on page load when FRAG_DB_VERSION changes
- Each userFragrances entry MUST have a matching fragranceDB row with the same fragranceId
- Community data (accords, notes, price) comes from FRAG_DB via normalized name+house lookup

## FRAG_DB to fragranceDB sync

1. Migrations fix stale names in FRAGRANCES (from sheet) BEFORE the rebuild
2. Rebuild iterates FRAGRANCES, looks up FRAG_DB by norm(name)+norm(house) for community data
3. One fragranceDB row per fragranceId — ID must match exactly
4. writeSheet checks response.ok, throws on HTTP errors
5. localStorage version only set on successful write; cleared on failure (retries next load)
6. **Bump FRAG_DB_VERSION** whenever FRAG_DB entries or migration rules change

## Known good patterns

- `appendRow()` for new records, `writeSheet()` for edits/deletes
- `buildYearSelect()` for year ranges — never hardcode years
- Gender: Female and Male only. Default: Female.
- Status: Obsessed / Love / Like / Just OK / Don't Like / WTF
- Relation: Stranger, Friend, Colleague / Client, Family, Significant Other, Other
- Size: Sample, Travel, Full Bottle, Decant

## Before every commit

1. Validate JS syntax in all script blocks
2. Confirm no functions reference undefined variables
3. Confirm all modal open/close functions reset form state
4. `git add index.html && git commit` then `git push origin main`

## When adding fragrances to FRAG_DB

1. Add the entry to the FRAG_DB array with correct accords, notes, price
2. Add seed entries to FRAGRANCES for each user who owns it
3. If the name might already exist on the sheet with a different spelling, add a migration rule
4. Bump FRAG_DB_VERSION
