# tęsknota — Architecture & Deployment

## Overview

Single-file SPA. No framework, no npm, no server.
All data lives in Google Sheets. All logic lives in `index.html`.

```
index.html          — full app (HTML + CSS + JS, ~3500 lines)
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
| Chatbot | Anthropic API (optional, stub present) |

---

## Credentials / Config

All secrets go in Cloudflare Pages → Settings → Environment Variables.
`build.js` runs at deploy time and writes `config.js` from those vars.
Locally, copy `config.example.js` → `config.js` and fill in real values.

| Env var | Required | Purpose |
|---------|----------|---------|
| `SA_EMAIL` | ✅ | Service account email |
| `SA_KEY` | ✅ | Service account private key (full PEM, newlines as `\n`) |
| `SPREADSHEET_ID` | ✅ | Google Sheet ID |
| `ANTHROPIC_API_KEY` | ⬜ | Enables chatbot quick-entry |
| `WORKER_URL` | ⬜ | Enables real Fragrantica metadata fetch |
| `VISION_API_KEY` | ⬜ | Enables bottle scan via camera |

---

## Google Sheets Structure

Sheet ID: `1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas`

### Tab: `users`
`id | name | createdAt`

Pre-seeded with two rows (Kiana, Sylvia). Do not re-run `setup-sheets.js`.

### Tab: `fragrances`
`id | userId | name | house | status | sizeOwned | communityRating | communityLong | communitySill | avgPrice | notes | personalRating | statusRating | personalLong | personalSill | whereBought | purchaseDate | isDupe | dupeFor | personalNotes | createdAt`

### Tab: `compliments`
`id | userId | primaryFragranceId | primaryFragranceName | secondaryFragranceId | secondaryFragranceName | complimenterGender | relation | month | year | location | notes | createdAt`

---

## Data Flow

```
App loads → getAccessToken() (JWT via Web Crypto)
         → loadAllData() (reads users / fragrances / compliments tabs)
         → rowToFrag() / rowToComp() transforms sheet rows → in-memory objects
         → checkIdentity() → identity screen or main shell

User action → mutates FRAGRANCES[] or COMPLIMENTS[] in memory
            → appendRow() for new records (fast, appends one row)
            → writeSheet() for edits/deletes (full tab rewrite)
            → fragToRow() / compToRow() transforms back to sheet format
            → setSyncState('syncing' → 'ok' | 'error')
```

All sheet writes are fire-and-forget (`.catch()` logs error, UI never blocks).

---

## Identity Model

Two users. Identity chosen once, stored in `localStorage.currentUser`.
On return visits, identity screen is skipped.

`CURRENT_USER` — the logged-in user object
`getFriend()` — the other user
`myFragrances()` / `myCompliments()` — filter by `CURRENT_USER.id`
`friendFragrances()` / `friendCompliments()` — filter by friend's id

---

## Import Features

### Link import (Tab 1)
- If `WORKER_URL` set: POST URL to Cloudflare Worker → structured JSON
- If `WORKER_URL` absent: parse name + house from URL slug (fallback)
- Worker code: `fetch-metadata.js` (deploy separately to Cloudflare Workers)

### Bottle scan (Tab 2)
- If `VISION_API_KEY` set: open rear camera → capture → Google Cloud Vision OCR → match against FRAG_DB
- If `VISION_API_KEY` absent: shows setup prompt on tap

### CSV (Tab 3)
- Static UI, not yet wired

---

## Cloudflare Worker (fetch-metadata)

Deploy `fetch-metadata.js` separately:
1. `dash.cloudflare.com` → Workers & Pages → Create → Worker
2. Name: `tesknota-fetch-metadata`
3. Paste `fetch-metadata.js` → Deploy
4. Copy the worker URL → add as `WORKER_URL` in Cloudflare Pages env vars

Supports: `fragrantica.com`, `sephora.com`, `fragrancenet.com`, `jomashop.com`, `scentsplit.com`

---

## Local Development

```bash
cd /path/to/tesknota
cp config.example.js config.js   # fill in real values
python3 -m http.server 8080
open http://localhost:8080
```

No build step needed locally — `index.html` reads `config.js` directly.

---

## Cloudflare Pages Deployment

1. Push to `main` branch → Cloudflare Pages auto-deploys
2. Build command: `node build.js`
3. Output directory: `/` (root)
4. Set all env vars in Cloudflare Pages → Settings → Environment Variables

Pages URL: `tesknota.pages.dev` (or custom domain)

---

## Steps Completed

| Step | Description | Commit |
|------|-------------|--------|
| 1 | Core infrastructure — JWT auth, Sheets helpers, state | `2c5a010` |
| 2 | Async init — loadAllData on startup | `4d2907b` |
| 3 | Accessor functions — myFragrances, myCompliments, getFriend | `b082cff` |
| 4 | Sheet transforms — fragToRow/rowToFrag/compToRow/rowToComp | `ba5da24` |
| 5 | Wire all saves to Sheets | `0b9be5d` |
| 6 | Friend profile and compare overlay — real live data | `ba21f56` |
| 7 | Analytics — all stats compute from state, no hardcoded values | `4c07faa` |
| 8 | Real link import — fetchLink() + Worker + slug fallback | `bfbdcdb` |
| 9 | Real bottle scan — Vision API + camera capture | `51199b3` |
| 10 | Chatbot stub — coming-soon gate + callAnthropic() stub | (current) |
| 11 | build.js — added WORKER_URL + VISION_API_KEY | (current) |
| 12 | ARCHITECTURE.md | (current) |
