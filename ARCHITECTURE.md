# tesknota — Architecture & Deployment

## Overview

Single-file SPA. No framework, no npm, no server.
All data lives in Google Sheets. All logic lives in `index.html`.

```
index.html          — full app (HTML + CSS + JS)
config.js           — runtime env vars (gitignored, written by build.js at deploy)
build.js            — Cloudflare Pages build script
fetch-metadata.js   — Cloudflare Worker (separate deploy)
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS, single HTML file |
| Database | Google Sheets (Sheets API v4) |
| Auth | Google Service Account JWT signed in-browser via Web Crypto API |
| Hosting | Cloudflare Pages (auto-deploy from GitHub push) |
| Metadata proxy | Cloudflare Worker (`tesknota-fetch-metadata`) |
| Bottle scan | Google Cloud Vision API (optional) |

---

## Credentials / Config

All secrets go in Cloudflare Pages → Settings → Environment Variables.
`build.js` runs at deploy time and writes `config.js` from those vars.
Locally, copy `config.example.js` → `config.js` and fill in real values.

| Env var | Required | Purpose |
|---------|----------|---------|
| `SA_EMAIL` | Yes | Service account email |
| `SA_KEY` | Yes | Service account private key (full PEM, newlines as `\n`) |
| `SPREADSHEET_ID` | Yes | Google Sheet ID |
| `WORKER_URL` | No | Enables real Fragrantica metadata fetch |
| `VISION_API_KEY` | No | Enables bottle scan via camera |

---

## Google Sheets Structure

Sheet ID: `1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas`

### Tab: `users`
```
id | name | createdAt
```
Pre-seeded with two rows (Kiana = u1, Sylvia = u2).

### Tab: `userFragrances`
```
userId | fragranceId | status | bottleSize | type |
boughtFrom | purchaseMonth | purchaseYear | purchasePrice |
personalLongevity | personalSillage | personalRating | notes | addedAt
```
- `fragranceId` (e.g. k17, s13) is the primary key — links to `fragranceDB.fragranceId` and `userCompliments.primaryFragranceId`
- `status`: CURRENT, USED_UP, SOLD, WANT_TO_BUY
- `bottleSize`: comma-separated (Sample, Travel, Full Bottle, Decant)
- `type`: Eau de Parfum, Eau de Toilette, Extrait de Parfum, Body Spray, Perfume Oil, Cologne, Perfume Concentre, Other
- `purchaseMonth`/`purchaseYear`: stored separately, displayed as "Mon YYYY"

### Tab: `userCompliments`
```
complimentId | userId | primaryFragranceId | secondaryFragranceId |
complimenterGender | relation | month | year |
locationName | city | state | country | notes | createdAt
```
- `primaryFragranceId` links to `userFragrances.fragranceId`
- `relation`: Stranger, Friend, Colleague / Client, Family, Significant Other, Other

### Tab: `fragranceDB`
```
fragranceId | fragranceName | fragranceHouse | fragranceType |
fragranceAccords | topNotes | middleNotes | baseNotes |
avgPrice | addedBy | addedAt
```
- **Auto-generated** from `FRAG_DB` (hardcoded JS array in index.html) on each page load when `FRAG_DB_VERSION` changes
- One row per FRAG_DB entry with **neutral IDs** (f1, f2, ...) based on array position — not tied to any user
- `userFragrances` still uses per-user IDs (k1, s1, etc.) — these link to fragranceDB by name+house lookup, not by ID
- Community data (accords, notes, price) comes directly from FRAG_DB — no lookup needed since rows ARE FRAG_DB entries
- `resolveFragById()` reads this tab to resolve fragrance names from IDs

---

## FRAG_DB → fragranceDB Sync

`FRAG_DB` is a hardcoded JS array (~455 entries) that holds community fragrance data: accords, top/mid/base notes, price, rating, longevity, sillage. It is the **source of truth** for community data.

### Sync flow (runs in `loadAllData()`)

1. **Read** all sheet tabs in parallel (users, userFragrances, userCompliments, fragranceDB)
2. **Merge** sheet data into seed arrays — sheet data overrides seeds for matching IDs
3. **Migrate** — fix known name variants in FRAGRANCES (e.g. "Eclair EDP" → "Eclair", "That Girl Viral Vanilla Extrait" → "That Girl Viral Vanilla")
4. **Rebuild fragranceDB** — iterate FRAG_DB directly, assign neutral f-IDs (f1, f2, ...) by array position, write one row per unique fragrance
5. **Version gate** — `FRAG_DB_VERSION` in code vs `fragDBSyncedVersion` in localStorage. Only rewrites sheet when they differ.
6. **Error handling** — `writeSheet` checks `response.ok` and throws on HTTP errors. On failure, localStorage version is cleared so the next load retries.

### When to bump FRAG_DB_VERSION

Bump the version string whenever:
- FRAG_DB entries are added, removed, or modified
- Migration rules are added
- The fragranceDB row-building logic changes

### Migration block

The migration block in `loadAllData()` fixes known name/type errors that were previously written to the userFragrances sheet. It runs **before** the fragranceDB rebuild so names are corrected before the FRAG_DB lookup.

Current migrations:
- EDP → Eau de Parfum, EDT → Eau de Toilette, Extrait → Extrait de Parfum, Body Mist → Body Spray
- Eclair Pistache / Eclair Pistachio → Eclaire Pistache
- Matcha Made in Heaven → Match Made in Heaven
- Yum Pistachio Gelato 33 → Yum Pistachio Gelato | 33
- Cheirosa 62 → SOL Cheirosa '62
- Eucalyptus 18 → Eucalyptus 20
- Eclair EDP → Eclair
- That Girl Viral Vanilla Extrait → That Girl Viral Vanilla
- Miss Girl Extrait → Miss Girl
- Amber (Nemat) → Amber Perfume Oil
- Coco Vanille → Vanille Coco

---

## Data Flow

```
App loads → getAccessToken() (JWT via Web Crypto)
         → loadAllData():
           1. Read all 4 sheet tabs in parallel
           2. Populate COMMUNITY_FRAGS from fragranceDB tab
           3. Merge sheet data into FRAGRANCES / COMPLIMENTS
           4. Dedup by ID, then by name+house+type+userId+status
           5. Run migrations (fix stale names/types)
           6. Rebuild fragranceDB tab if FRAG_DB_VERSION changed
           7. Sync missing seed entries to sheets
         → Identity screen → main shell

User action → mutates FRAGRANCES[] or COMPLIMENTS[] in memory
            → appendRow() for new records (fast, appends one row)
            → writeSheet() for edits/deletes (full tab rewrite)
            → fragToRow() / compToRow() transforms back to sheet format
            → setSyncState('syncing' → 'ok' | 'error')
```

`writeSheet()` checks `response.ok` on both the clear and write calls. Throws on HTTP errors so callers can handle failures.

---

## Identity Model

Two users only. Identity chosen on each visit via landing screen.

- `CURRENT_USER` — the selected user object
- `getFriend()` — the other user
- `myFragrances()` / `myCompliments()` — filter by `CURRENT_USER.id`
- `friendFragrances()` / `friendCompliments()` — filter by friend's id

---

## Key Functions

| Function | Purpose |
|----------|---------|
| `getCommunityData(name, house, type)` | Look up FRAG_DB by normalized name+house, optional type for multi-conc entries |
| `fragToDbRow(f)` | Build a fragranceDB sheet row from a FRAGRANCES entry + FRAG_DB community data |
| `fragToRow(f)` | Build a userFragrances sheet row from an in-memory fragrance object |
| `rowToFrag(row)` | Parse a userFragrances sheet row into an in-memory fragrance object |
| `compToRow(c)` | Build a userCompliments sheet row from an in-memory compliment object |
| `rowToComp(row)` | Parse a userCompliments sheet row into an in-memory compliment object |
| `resolveFragById(fragId)` | Resolve a fragranceId to {name, house} via COMMUNITY_FRAGS → FRAGRANCES fallback |
| `writeSheet(tab, rows, headers)` | Clear + rewrite an entire sheet tab (checks response.ok, throws on error) |
| `appendRow(tab, row, headers)` | Append a single row to a sheet tab |
| `syncMissingRows(tab, rows, headers, label)` | Append seed rows not yet in the sheet (one at a time with 300ms delay) |

---

## Import Features

### Link import (Tab 1)
- If `WORKER_URL` set: POST URL to Cloudflare Worker → structured JSON
- If `WORKER_URL` absent: parse name + house from URL slug (fallback)

### Bottle scan (Tab 2)
- If `VISION_API_KEY` set: open rear camera → Google Cloud Vision OCR → match against FRAG_DB
- If absent: shows setup prompt

---

## Local Development

```bash
cd /path/to/tesknota
cp config.example.js config.js   # fill in real values
python3 -m http.server 8080
open http://localhost:8080
```

No build step needed locally — `index.html` reads `config.js` directly.

## Deployment

1. Push to `main` → Cloudflare Pages auto-deploys
2. Build command: `node build.js`
3. Output directory: `/` (root)
4. Set all env vars in Cloudflare Pages → Settings → Environment Variables
