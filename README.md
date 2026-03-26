# tęsknota — Complete Build Handoff

Private 2-user fragrance tracker for Kiana and Sylvia.
Built as a single HTML file with Google Sheets as the database — identical architecture to `github.com/saturdaythings/ATS-HRIS`.

---

## SETUP STATUS — ALREADY COMPLETE. DO NOT REDO.

The Google Sheet exists, credentials are valid, tabs are seeded.
- Sheet: `https://docs.google.com/spreadsheets/d/1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas/edit`
- Tabs created: `users` (Kiana u1 + Sylvia u2 seeded), `fragrances` (headers only), `compliments` (headers only)
- `config.js` in repo root has valid `SA_EMAIL`, `SA_KEY`, `SPREADSHEET_ID`
- `ANTHROPIC_API_KEY` is empty — chatbot shows "Coming soon" until added later
- Sheets API is enabled in Google Cloud project `singular-cache-491415-q6`
- Service account: `tesknota-sheets@singular-cache-491415-q6.iam.gserviceaccount.com`

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Single `index.html` — all HTML, CSS, JS in one file. No framework. No build step. |
| Database | Google Sheets — one spreadsheet, one tab per data type |
| Auth | Google Service Account JWT signed via Web Crypto API in the browser |
| Hosting | Cloudflare Pages — free tier, auto-deploys from GitHub |
| Credentials | Injected at Cloudflare build time via `build.js` from env vars |
| Vision API | Google Cloud Vision — for bottle scan / label recognition |
| Proxy Worker | Cloudflare Worker — for Fragrantica URL fetching (CORS bypass) |
| Chatbot | Anthropic API — called directly from browser (add key later) |

No Node server. No Express. No Prisma. No Next.js. No npm install. No database.

---

## File structure

```
/
├── index.html                ← The entire app
├── worker/
│   └── fetch-metadata.js     ← Cloudflare Worker for Fragrantica URL proxy
├── build.js                  ← Cloudflare Pages build script
├── config.js                 ← Real credentials — GITIGNORED
├── config.example.js         ← Credential template
├── setup-sheets.js           ← Already run — do not run again
├── verify-setup.js           ← Run to confirm credentials work
├── .gitignore                ← Excludes config.js
├── ARCHITECTURE.md           ← Technical reference (Claude Code writes this)
├── README.md                 ← This file
└── tesknota-prototype.html   ← Design source of truth — reference only, do not deploy
```

---

## How credentials work

- `SA_EMAIL`, `SA_KEY`, `SPREADSHEET_ID`, `ANTHROPIC_API_KEY`, `VISION_API_KEY` stored as Cloudflare Pages env vars
- At deploy time, `build.js` runs and writes `config.js` with all values injected
- `index.html` loads `config.js` via `<script src="config.js">` — must be the first script tag
- `getAccessToken()` signs a JWT using Web Crypto API (copy this function verbatim from ATS-HRIS)
- All Google Sheets reads/writes use the resulting Bearer token

---

## config.example.js

```javascript
window.__ENV__ = {
  SA_EMAIL:          'tesknota-sheets@singular-cache-491415-q6.iam.gserviceaccount.com',
  SA_KEY:            '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
  SPREADSHEET_ID:    '1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas',
  ANTHROPIC_API_KEY: '',           // add later for chatbot
  VISION_API_KEY:    '',           // add for bottle scan feature
  WORKER_URL:        '',           // add after deploying fetch-metadata worker
};
```

---

## build.js

```javascript
const fs = require('fs');
const email      = process.env.SA_EMAIL;
const key        = (process.env.SA_KEY || '').replace(/\\n/g, '\n');
const sheetId    = process.env.SPREADSHEET_ID;
const anthropic  = process.env.ANTHROPIC_API_KEY || '';
const vision     = process.env.VISION_API_KEY || '';
const workerUrl  = process.env.WORKER_URL || '';

if (!email || !key || !sheetId) {
  console.error('Missing SA_EMAIL, SA_KEY, or SPREADSHEET_ID');
  process.exit(1);
}
fs.writeFileSync('config.js', 'window.__ENV__=' + JSON.stringify({
  SA_EMAIL: email, SA_KEY: key, SPREADSHEET_ID: sheetId,
  ANTHROPIC_API_KEY: anthropic, VISION_API_KEY: vision, WORKER_URL: workerUrl,
}) + ';');
console.log('config.js written');
```

Cloudflare Pages build settings:
- Build command: `node build.js`
- Build output directory: `/`

---

## Google Sheets structure

### Tab: `users`
| id | name | createdAt |
|---|---|---|
| u1 | Kiana | (timestamp) |
| u2 | Sylvia | (timestamp) |

### Tab: `fragrances`
| id | userId | name | house | status | sizeOwned | communityRating | communityLong | communitySill | avgPrice | notes | personalRating | statusRating | personalLong | personalSill | whereBought | purchaseDate | isDupe | dupeFor | personalNotes | createdAt |

Status values: `CURRENT` `PREVIOUSLY_OWNED` `WANT_TO_SMELL` `WANT_TO_BUY` `DONT_LIKE`

### Tab: `compliments`
| id | userId | primaryFragranceId | primaryFragranceName | secondaryFragranceId | secondaryFragranceName | complimenterGender | relation | month | year | location | notes | createdAt |

---

## State management

```javascript
const state = {
  currentUser: null,  // { id, name } from localStorage
  fragrances:  [],    // ALL fragrances for both users
  compliments: [],    // ALL compliments for both users
  users:       [],    // both user records
  loaded:      false,
};

// Computed accessors — always derive, never store
function myFragrances()     { return state.fragrances.filter(f => f.userId === state.currentUser.id); }
function friendFragrances() { return state.fragrances.filter(f => f.userId !== state.currentUser.id); }
function myCompliments()    { return state.compliments.filter(c => c.userId === state.currentUser.id); }
function friendCompliments(){ return state.compliments.filter(c => c.userId !== state.currentUser.id); }
function getFriend()        { return state.users.find(u => u.id !== state.currentUser.id); }
```

---

## Google Sheets API helpers

Copy `getAccessToken()` from ATS-HRIS verbatim. Then implement:

```javascript
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets/' + window.__ENV__.SPREADSHEET_ID;

async function readSheet(tabName) {
  const token = await getAccessToken();
  const res = await fetch(SHEETS_BASE + '/values/' + tabName, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const data = await res.json();
  const rows = data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i] || ''; });
    return obj;
  });
}

async function writeSheet(tabName, rows, headers) {
  // Update state first (instant UI), then write to sheet
  setSyncState('syncing');
  const token = await getAccessToken();
  const authHeader = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  await fetch(SHEETS_BASE + '/values/' + tabName + ':clear', { method: 'POST', headers: authHeader });
  if (!rows.length) { setSyncState('ok'); return; }
  const values = [headers].concat(rows.map(function(row) {
    return headers.map(function(h) {
      var v = row[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    });
  }));
  await fetch(SHEETS_BASE + '/values/' + tabName + '?valueInputOption=RAW', {
    method: 'PUT', headers: authHeader, body: JSON.stringify({ values: values })
  });
  setSyncState('ok');
}

async function appendRow(tabName, row, headers) {
  setSyncState('syncing');
  const token = await getAccessToken();
  const values = [headers.map(function(h) {
    var v = row[h];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  })];
  await fetch(SHEETS_BASE + '/values/' + tabName + ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + await getAccessToken(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: values })
  });
  setSyncState('ok');
}

async function loadAllData() {
  const results = await Promise.all([
    readSheet('users'),
    readSheet('fragrances'),
    readSheet('compliments'),
  ]);
  state.users       = results[0];
  state.fragrances  = results[1];
  state.compliments = results[2];
  state.loaded      = true;
}
```

**Write strategy:**
- New record → `appendRow()` (fast, no full rewrite)
- Edit or delete → update `state` array in memory, then `writeSheet()` with full array

---

## Identity / login

No passwords. No OAuth. Two hardcoded users. Identity is stored in localStorage.

**On first visit** (no `localStorage.currentUser`):
- Show full-screen identity screen (navy background, wordmark, definition bar)
- Two buttons: Kiana and Sylvia
- On click: find matching record in `state.users` → store `{id, name}` in `localStorage.currentUser` → show app

**On return visits:**
- Read `localStorage.currentUser` → skip identity screen → load data → show app

**Sign out:** Settings → Sign Out → clears `localStorage.currentUser` → shows identity screen

---

## Import feature — full implementation spec

The import page has three tabs: Paste a Link, Scan / Photo, CSV.
All three are currently stubbed (simulated). Replace with real implementations as follows.

---

### Import Tab 1: Paste a Link (Fragrantica URL)

**The problem:** Fetching Fragrantica from the browser is blocked by CORS. The browser cannot make a direct `fetch()` to fragrantica.com.

**The solution:** A Cloudflare Worker acting as a server-side proxy. The worker fetches the URL server-side (no CORS restriction), parses the HTML, and returns structured JSON to the browser.

#### What Kiana needs to do manually (one-time setup):

1. Go to `https://dash.cloudflare.com` → Workers & Pages → Create → Worker
2. Name it `tesknota-fetch-metadata`
3. Paste the worker code below → Deploy
4. Copy the worker URL (looks like `https://tesknota-fetch-metadata.YOUR-SUBDOMAIN.workers.dev`)
5. Add it as `WORKER_URL` environment variable in Cloudflare Pages settings
6. Redeploy the Pages app so `build.js` writes it into `config.js`

#### Cloudflare Worker code — `worker/fetch-metadata.js`

```javascript
// Cloudflare Worker: tesknota-fetch-metadata
// Fetches a Fragrantica URL server-side and returns structured fragrance metadata as JSON
// Deploy to Cloudflare Workers — free tier is plenty (100k requests/day)

export default {
  async fetch(request) {
    // CORS headers — allow requests from your Cloudflare Pages domain
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = body.url;
    if (!url || (!url.includes('fragrantica.com') && !url.includes('sephora.com') && !url.includes('fragrancenet.com'))) {
      return new Response(JSON.stringify({ error: 'URL must be from fragrantica.com, sephora.com, or fragrancenet.com' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let html;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!response.ok) throw new Error('Fetch failed: ' + response.status);
      html = await response.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Could not fetch URL: ' + e.message }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse Fragrantica HTML
    // These selectors are current as of 2025 — may need updating if Fragrantica redesigns
    const result = {
      name:            extractText(html, '<h1 itemprop="name">', '</h1>') || extractFromSlug(url),
      house:           extractText(html, '<span itemprop="name">', '</span>') || extractHouseFromSlug(url),
      communityRating: extractRating(html),
      topNotes:        extractNotes(html, 'Top Notes'),
      middleNotes:     extractNotes(html, 'Heart Notes'),
      baseNotes:       extractNotes(html, 'Base Notes'),
      allNotes:        '',
      communityLong:   extractLongevity(html),
      communitySill:   extractSillage(html),
      url:             url,
      parseConfidence: 'auto',
    };

    // Combine all notes
    const noteParts = [result.topNotes, result.middleNotes, result.baseNotes].filter(Boolean);
    result.allNotes = noteParts.join(', ');

    // If name not found, fall back to slug parsing
    if (!result.name) {
      result.name = extractFromSlug(url);
      result.parseConfidence = 'slug-only';
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

function extractText(html, startTag, endTag) {
  const start = html.indexOf(startTag);
  if (start === -1) return '';
  const end = html.indexOf(endTag, start + startTag.length);
  if (end === -1) return '';
  return html.slice(start + startTag.length, end).replace(/<[^>]+>/g, '').trim();
}

function extractRating(html) {
  // Fragrantica stores rating in meta tag
  const match = html.match(/<meta itemprop="ratingValue" content="([^"]+)"/);
  if (match) return parseFloat(match[1]);
  // Fallback: look for the rating display
  const match2 = html.match(/ratingValue[^>]*>([0-9.]+)/);
  if (match2) return parseFloat(match2[1]);
  return null;
}

function extractNotes(html, section) {
  // Fragrantica note sections contain the note names in pyramid structure
  const sectionIdx = html.indexOf(section);
  if (sectionIdx === -1) return '';
  const chunk = html.slice(sectionIdx, sectionIdx + 2000);
  const noteMatches = chunk.match(/title="([^"]+)"\s+class="[^"]*note/g) || [];
  const notes = noteMatches.map(function(m) {
    const t = m.match(/title="([^"]+)"/);
    return t ? t[1].trim() : '';
  }).filter(Boolean);
  return notes.join(', ');
}

function extractLongevity(html) {
  // Fragrantica longevity is voted by community — extract from vote section
  const keywords = ['very long', 'long', 'moderate', 'weak', 'very weak'];
  const lower = html.toLowerCase();
  for (const k of ['very long lasting', 'long lasting', 'moderate', 'weak']) {
    if (lower.includes(k)) return k.charAt(0).toUpperCase() + k.slice(1);
  }
  return null;
}

function extractSillage(html) {
  const lower = html.toLowerCase();
  for (const k of ['enormous', 'strong', 'moderate', 'soft', 'intimate']) {
    if (lower.includes(k + ' sillage') || lower.includes('sillage' + k)) {
      return k.charAt(0).toUpperCase() + k.slice(1);
    }
  }
  return null;
}

function extractFromSlug(url) {
  // e.g. fragrantica.com/perfume/Creed/Aventus-1077.html → "Aventus"
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    const last = parts[parts.length - 1].replace(/\.html$/, '');
    // Remove trailing number ID
    return last.replace(/-\d+$/, '').replace(/-/g, ' ').trim();
  } catch (e) {
    return '';
  }
}

function extractHouseFromSlug(url) {
  // e.g. fragrantica.com/perfume/Creed/Aventus-1077.html → "Creed"
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    // parts[0]='perfume', parts[1]='Creed', parts[2]='Aventus-...'
    if (parts.length >= 3) return parts[1].replace(/-/g, ' ');
    return '';
  } catch (e) {
    return '';
  }
}
```

#### How `fetchLink()` works in index.html

Replace `simLink()` in `index.html` with a real implementation:

```javascript
async function fetchLink() {
  const url = document.getElementById('linkIn').value.trim();
  if (!url) { toast('Paste a Fragrantica or retailer URL first'); return; }

  const workerUrl = window.__ENV__.WORKER_URL;
  if (!workerUrl) {
    // Worker not yet deployed — fall back to slug parsing only
    const name  = extractNameFromSlug(url);
    const house = extractHouseFromSlug(url);
    if (!name) { toast('Could not parse URL — try searching by name instead'); return; }
    showLinkResult({ name: name, house: house, parseConfidence: 'slug-only', url: url });
    return;
  }

  setSyncState('syncing');
  document.getElementById('linkFetchBtn').textContent = 'Fetching...';
  document.getElementById('linkFetchBtn').disabled = true;

  try {
    const res = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    showLinkResult(data);
    setSyncState('ok');
  } catch (e) {
    toast('Could not fetch metadata: ' + e.message);
    setSyncState('error');
    // Fall back to slug parsing
    const name  = extractNameFromSlug(url);
    const house = extractHouseFromSlug(url);
    if (name) showLinkResult({ name: name, house: house, parseConfidence: 'slug-only', url: url });
  } finally {
    document.getElementById('linkFetchBtn').textContent = 'Fetch Metadata';
    document.getElementById('linkFetchBtn').disabled = false;
  }
}

function extractNameFromSlug(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    const last  = parts[parts.length - 1].replace(/\.html$/, '').replace(/-\d+$/, '');
    return last.replace(/-/g, ' ').trim();
  } catch (e) { return ''; }
}

function extractHouseFromSlug(url) {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    return parts.length >= 3 ? parts[1].replace(/-/g, ' ') : '';
  } catch (e) { return ''; }
}

function showLinkResult(data) {
  // Show the result card in the UI
  document.getElementById('lr-name').textContent  = data.name || '';
  document.getElementById('lr-house').textContent = data.house || '';
  document.getElementById('lr-comm').textContent  = data.communityRating ? data.communityRating + ' / 5.0' : '—';
  document.getElementById('lr-long').textContent  = data.communityLong || '—';
  document.getElementById('lr-sill').textContent  = data.communitySill || '—';
  document.getElementById('lr-notes').textContent = data.allNotes || data.topNotes || '—';
  if (data.parseConfidence === 'slug-only') {
    document.getElementById('lr-confidence').textContent = 'Parsed from URL — verify name before saving';
    document.getElementById('lr-confidence').style.display = 'block';
  } else {
    document.getElementById('lr-confidence').style.display = 'none';
  }
  document.getElementById('linkRes').style.display = 'block';
  // Store fetched data for the Add to Collection / Add to Wishlist buttons
  window._fetchedFragData = data;
}
```

The "Add to Collection" and "Add to Wishlist" buttons read from `window._fetchedFragData` and pass it to `importToCollection()` / `importToWishlist()`.

---

### Import Tab 2: Scan / Photo (Google Cloud Vision)

**What it does:** Opens the device camera. User points it at a perfume bottle label. User taps Capture. The image is sent to Google Cloud Vision API which reads text from the label. The app extracts the fragrance name and house from the recognized text, matches it against FRAG_DB, and shows a confirmation card. User confirms or rejects.

**Why this works:** Most perfume bottles have the fragrance name and house printed clearly on the label. Vision API text recognition (OCR) reads this reliably. This is NOT barcode scanning — it reads the label text directly, which works far better for fragrances than barcode lookup.

#### What Kiana needs to do manually (one-time setup):

1. Go to `https://console.cloud.google.com` → select project `singular-cache-491415-q6`
2. APIs & Services → Library → search "Cloud Vision API" → Enable
3. The existing service account (`tesknota-sheets@singular-cache-491415-q6.iam.gserviceaccount.com`) already has the right permissions since it's in the same project
4. Create a Vision API key (separate from service account key):
   - APIs & Services → Credentials → Create Credentials → API Key
   - Copy the key
   - Restrict it: API restrictions → Cloud Vision API only
5. Add it as `VISION_API_KEY` environment variable in Cloudflare Pages
6. Also add it to your local `config.js` for testing

**Cost:** Google gives 1,000 Vision API calls/month free. After that it is $1.50 per 1,000 calls. For personal use you will never exceed the free tier.

#### How the scan feature works in index.html

Replace `simScan()` with a real implementation:

```javascript
async function startScan() {
  const visionKey = window.__ENV__.VISION_API_KEY;
  if (!visionKey) {
    toast('Vision API key not configured — add VISION_API_KEY to config.js');
    return;
  }

  // Request camera access
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }  // rear camera on mobile
    });
  } catch (e) {
    toast('Camera access denied — please allow camera in browser settings');
    return;
  }

  // Show live camera feed
  const video = document.getElementById('camVideo');
  const captureBtn = document.getElementById('camCaptureBtn');
  const scanView = document.getElementById('camView');
  video.srcObject = stream;
  video.style.display = 'block';
  scanView.style.display = 'none';
  captureBtn.style.display = 'block';
  captureBtn.textContent = 'Tap to capture label';

  // Store stream so we can stop it later
  window._camStream = stream;
}

async function captureAndIdentify() {
  const video = document.getElementById('camVideo');
  if (!video.srcObject) return;

  // Draw frame to canvas and convert to base64
  const canvas = document.createElement('canvas');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

  // Stop camera
  stopCamera();

  document.getElementById('camCaptureBtn').textContent = 'Identifying...';
  document.getElementById('camCaptureBtn').disabled = true;

  try {
    // Call Google Cloud Vision API
    const visionKey = window.__ENV__.VISION_API_KEY;
    const res = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + visionKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64 },
          features: [
            { type: 'TEXT_DETECTION', maxResults: 1 },
            { type: 'LOGO_DETECTION', maxResults: 3 },
          ]
        }]
      })
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    const fullText = data.responses[0]?.fullTextAnnotation?.text || '';
    const logoLabels = (data.responses[0]?.logoAnnotations || []).map(function(l) { return l.description; });

    // Extract fragrance name and house from recognized text
    const identified = identifyFragranceFromText(fullText, logoLabels);

    if (identified) {
      showScanResult(identified);
    } else {
      // Could not identify — show manual entry fallback
      document.getElementById('camNotFound').style.display = 'block';
      document.getElementById('camRawText').textContent = fullText.slice(0, 200);
      toast('Could not identify — try searching by name');
    }

  } catch (e) {
    toast('Vision API error: ' + e.message);
    document.getElementById('camView').style.display = 'flex';
    document.getElementById('camCaptureBtn').textContent = 'Tap to capture label';
    document.getElementById('camCaptureBtn').disabled = false;
  }
}

function identifyFragranceFromText(rawText, logoLabels) {
  if (!rawText && !logoLabels.length) return null;

  // Clean and split the raw OCR text into tokens
  const lines = rawText.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  const allText = (rawText + ' ' + logoLabels.join(' ')).toLowerCase();

  // Try to match against FRAG_DB
  var bestMatch = null;
  var bestScore = 0;

  FRAG_DB.forEach(function(frag) {
    var nameWords = frag.n.toLowerCase().split(' ');
    var houseWords = frag.h.toLowerCase().split(' ');
    var score = 0;

    nameWords.forEach(function(w) {
      if (w.length > 2 && allText.includes(w)) score += 2;
    });
    houseWords.forEach(function(w) {
      if (w.length > 2 && allText.includes(w)) score += 1;
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = frag;
    }
  });

  // Require a minimum confidence score
  if (bestScore < 2) return null;

  return {
    name: bestMatch.n,
    house: bestMatch.h,
    communityRating: bestMatch.r,
    communityLong: bestMatch.l,
    communitySill: bestMatch.s,
    avgPrice: bestMatch.p,
    allNotes: bestMatch.notes,
    parseConfidence: 'vision',
    rawText: rawText.slice(0, 200),
  };
}

function showScanResult(data) {
  document.getElementById('camVideo').style.display = 'none';
  document.getElementById('camCaptureBtn').style.display = 'none';
  document.getElementById('camView').style.display = 'none';

  document.getElementById('scan-name').textContent  = data.name;
  document.getElementById('scan-house').textContent = data.house;
  document.getElementById('scan-comm').textContent  = data.communityRating ? data.communityRating + ' / 5.0' : '—';
  document.getElementById('scan-notes').textContent = data.allNotes || '—';
  document.getElementById('camRes').style.display = 'block';

  // Store for Add buttons
  window._scannedFragData = data;
}

function stopCamera() {
  if (window._camStream) {
    window._camStream.getTracks().forEach(function(t) { t.stop(); });
    window._camStream = null;
  }
  document.getElementById('camVideo').srcObject = null;
  document.getElementById('camVideo').style.display = 'none';
}

function resetScan() {
  stopCamera();
  document.getElementById('camRes').style.display  = 'none';
  document.getElementById('camView').style.display = 'flex';
  document.getElementById('camNotFound').style.display = 'none';
  document.getElementById('camCaptureBtn').textContent = 'Tap to capture label';
  document.getElementById('camCaptureBtn').disabled = false;
  window._scannedFragData = null;
}
```

#### HTML changes needed for the scan tab

The cam panel in the prototype uses a static click-to-simulate design. Replace with:

```html
<div class="ipanel" id="ip-cam">
  <div class="cam-instruction">
    Point your camera at the fragrance label. Tap Capture when the label is clearly visible.
    Works best with good lighting and a flat label.
  </div>
  <div class="cam-box">
    <!-- Static "tap to start" view -->
    <div class="cam-view" id="camView" onclick="startScan()">
      <div class="cv-t">Tap to open camera</div>
      <div class="cv-s">Label recognition · Text detection</div>
    </div>
    <!-- Live camera feed (hidden until started) -->
    <video id="camVideo" autoplay playsinline style="display:none;width:100%;"></video>
    <!-- Capture button (hidden until camera is active) -->
    <button class="btn btn-blue" id="camCaptureBtn" style="display:none;width:100%;margin-top:8px;" onclick="captureAndIdentify()">Tap to capture label</button>
    <!-- Result card (hidden until identified) -->
    <div class="cam-res" id="camRes" style="display:none;">
      <div class="cam-label">Identified from label — confirm before saving</div>
      <div class="lr-n" id="scan-name"></div>
      <div class="lr-h" id="scan-house"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
        <div><div class="lrl">Community</div><div class="lrv" id="scan-comm"></div></div>
        <div><div class="lrl">Notes</div><div class="lrv" id="scan-notes" style="font-size:11px;"></div></div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-blue" onclick="importToCollection(window._scannedFragData)">Add to Collection</button>
        <button class="btn btn-ghost" onclick="importToWishlist(window._scannedFragData);resetScan()">Add to Wishlist</button>
        <button class="btn-bare" onclick="resetScan()">Rescan</button>
      </div>
    </div>
    <!-- Not found fallback -->
    <div id="camNotFound" style="display:none;padding:16px;">
      <div style="font-size:12px;color:var(--ink3);margin-bottom:8px;">Could not identify. Text detected:</div>
      <div id="camRawText" style="font-family:var(--mono);font-size:10px;color:var(--ink2);"></div>
    </div>
  </div>
  <div style="font-family:var(--mono);font-size:8px;color:var(--ink3);letter-spacing:.1em;text-transform:uppercase;margin-top:8px;">
    Not working? <span style="color:var(--blue);cursor:pointer;" onclick="selIM('link');document.getElementById('qSrch').focus()">Search by name instead</span>
  </div>
</div>
```

#### What to tell the user if Vision API key is missing

If `VISION_API_KEY` is empty in config.js, clicking "Tap to open camera" shows:

> "Bottle scan requires a Google Vision API key. Go to Settings → Configure Scan to set it up."

This prevents a broken experience while the key is not yet configured.

---

### Import Tab 3: CSV / Spreadsheet

Fully implemented in the prototype. Wire to real state:

```javascript
// When file is dropped or selected:
function handleCSVFile(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const rows = parseCSV(e.target.result);
    // rows is array of objects with headers as keys
    const preview = rows.map(function(row) {
      const exists = myFragrances().find(function(f) {
        return f.name.toLowerCase() === (row.Name || row.name || '').toLowerCase();
      });
      return {
        name:            row.Name || row.name || '',
        house:           row.Brand || row.brand || row.House || row.house || '',
        status:          row.Status || row.status || 'CURRENT',
        personalRating:  row.Rating || row.rating || '',
        notes:           row.Notes || row.notes || '',
        isDup:           !!exists,
      };
    }).filter(function(r) { return r.name; });
    renderCSVPreview(preview);
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map(function(h) { return h.trim().replace(/"/g, ''); });
  return lines.slice(1).map(function(line) {
    const vals = line.split(',').map(function(v) { return v.trim().replace(/"/g, ''); });
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = vals[i] || ''; });
    return obj;
  });
}
```

After user clicks Import Selected:
- Non-duplicate checked rows → `appendRow('fragrances', newFrag, FRAG_HEADERS)` for each
- Navigate to collection page after import completes

---

## Command palette — full implementation spec

The command palette is fully built in the prototype (see palette section at bottom of `index.html`). It is purely additive — no existing functions were changed.

**Trigger:** Cmd+K (Mac) / Ctrl+K (Windows/Linux) or the floating "Actions" button bottom-left.

**9 flows:**

| Flow key | What it does | Steps |
|---|---|---|
| `frag-add` | Add a fragrance to collection | Search name → Status → Rating → Feel → Sizes → Longevity → Sillage → Where bought → Purchase date → Dupe? → Notes → Confirm |
| `frag-edit` | Edit an existing fragrance | Pick fragrance → Status → Rating → Feel → Longevity → Sillage → Notes → Confirm |
| `frag-status` | Change a fragrance's status only | Pick fragrance → New status → Confirm |
| `frag-delete` | Remove a fragrance | Pick fragrance → Confirm (danger) |
| `comp-log` | Log a new compliment | Pick primary frag → Pick secondary (skippable) → Relation → Gender → Date → Location → Notes → Confirm |
| `comp-edit` | Edit an existing compliment | Pick compliment → Relation → Location → Notes → Confirm |
| `comp-delete` | Delete a compliment | Pick compliment → Confirm (danger) |
| `wish-add` | Add a fragrance to wishlist | Search name → Want to Buy / Want to Smell → Confirm |
| `wish-promote` | Mark a wishlist item as bought | Pick wishlist item → Rating → Where bought → Confirm |

**UX rules:**
- Every step shows Step N of N in the top right corner
- Back button on every step — goes to previous step, or back to the action menu on step 1
- Confirm step always shows a summary of all answers before saving
- Danger actions (delete, remove) show a red save button and "This cannot be undone"
- Saving always updates in-memory state first (instant UI), then writes to Google Sheets

**Wiring to Google Sheets — critical:**
Every `onSave` handler in the palette currently mutates the in-memory `FRAGRANCES` or `COMPLIMENTS` array. When wiring to sheets, add the corresponding sheet write after the array mutation:

```javascript
// Example: frag-add onSave
FRAGRANCES.push(newFrag);
appendRow('fragrances', newFrag, FRAG_HEADERS);  // ADD THIS LINE

// Example: frag-delete onSave
FRAGRANCES = FRAGRANCES.filter(...);
writeSheet('fragrances', myFragrances(), FRAG_HEADERS);  // ADD THIS LINE

// Example: comp-log onSave
COMPLIMENTS.unshift(newComp);
appendRow('compliments', newComp, COMP_HEADERS);  // ADD THIS LINE
```

Do NOT rewrite the palette flows themselves — only add the sheet write calls inside the existing `onSave` handlers.

---

## Chatbot — implementation spec

The chatbot panel is built in the prototype. When `ANTHROPIC_API_KEY` is empty, show:

```
"Quick Entry assistant coming soon.
Add your Anthropic API key in Settings to enable."
```

When `ANTHROPIC_API_KEY` is set, replace the local `handleChat()` intent detection with an Anthropic API call:

```javascript
async function callAnthropic(userMessage) {
  const key = window.__ENV__.ANTHROPIC_API_KEY;
  if (!key) return { action: 'ANSWER', data: { reply: 'Anthropic key not configured.' } };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: 'You are a quick-entry assistant for tesknota, a private fragrance tracker. Parse the user message and return ONLY valid JSON, no preamble, no markdown. Actions: LOG_COMPLIMENT {fragrance,relation,notes?,gender?,location?} | ADD_FRAGRANCE {name,status} | UPDATE_RATING {fragrance,rating} | CHANGE_STATUS {fragrance,newStatus} | ANSWER {reply}. Example: {"action":"LOG_COMPLIMENT","data":{"fragrance":"Baccarat Rouge 540","relation":"Stranger"},"reply":"Logging a stranger compliment for BR540."}',
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  const data = await res.json();
  const text = (data.content && data.content[0] && data.content[0].text) || '{}';
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    return { action: 'ANSWER', data: { reply: text }, reply: text };
  }
}
```

After parsing the action, execute it:
- `LOG_COMPLIMENT` → call `saveCompliment()` with pre-filled data → `appendRow()`
- `ADD_FRAGRANCE` → find in FRAG_DB → `FRAGRANCES.push()` → `appendRow()`
- `UPDATE_RATING` → find fragrance → update `personalRating` → `writeSheet()`
- `CHANGE_STATUS` → find fragrance → update `status` → `writeSheet()`
- `ANSWER` → display reply text in chat bubble

---

## All other features — wiring spec

All of these are built in the prototype. When wiring to Google Sheets, the pattern is identical for each:

### Add fragrance (modal — openAddFrag / saveFragrance)
```javascript
// After: FRAGRANCES.push(newFrag)
await appendRow('fragrances', newFrag, FRAG_HEADERS);
renderCurrentPage();
updateCounts();
```

### Edit fragrance (modal — openEditFrag / saveFragrance with editingFragId set)
```javascript
// After: FRAGRANCES[idx] = {...FRAGRANCES[idx], ...data}
await writeSheet('fragrances', myFragrances(), FRAG_HEADERS);
renderCurrentPage();
```

### Remove fragrance (confirmRemove)
```javascript
// After: FRAGRANCES = FRAGRANCES.filter(...)
await writeSheet('fragrances', myFragrances(), FRAG_HEADERS);
renderCurrentPage();
updateCounts();
```

### Change status (changeStatus)
```javascript
// After: f.status = newStatus
await writeSheet('fragrances', myFragrances(), FRAG_HEADERS);
```

### Log compliment (saveCompliment)
```javascript
// After: COMPLIMENTS.unshift(newComp)
await appendRow('compliments', newComp, COMP_HEADERS);
renderCurrentPage();
updateCounts();
```

### Delete compliment (deleteCompliment)
```javascript
// After: COMPLIMENTS = COMPLIMENTS.filter(...)
await writeSheet('compliments', myCompliments(), COMP_HEADERS);
renderCurrentPage();
updateCounts();
```

### Import to collection (importToCollection)
```javascript
// After: FRAGRANCES.push(newFrag) inside the save handler
await appendRow('fragrances', newFrag, FRAG_HEADERS);
```

### Import to wishlist (importToWishlist)
```javascript
// After: FRAGRANCES.push(newFrag)
await appendRow('fragrances', newFrag, FRAG_HEADERS);
```

### Bulk import (confirmBulkImport)
```javascript
// After all FRAGRANCES.push() calls:
for (const frag of newFragrances) {
  await appendRow('fragrances', frag, FRAG_HEADERS);
}
```

---

## Header constants (define once, use everywhere)

```javascript
const FRAG_HEADERS = [
  'id','userId','name','house','status','sizeOwned',
  'communityRating','communityLong','communitySill','avgPrice','notes',
  'personalRating','statusRating','personalLong','personalSill',
  'whereBought','purchaseDate','isDupe','dupeFor','personalNotes','createdAt'
];

const COMP_HEADERS = [
  'id','userId','primaryFragranceId','primaryFragranceName',
  'secondaryFragranceId','secondaryFragranceName','complimenterGender',
  'relation','month','year','location','notes','createdAt'
];

const USER_HEADERS = ['id','name','createdAt'];
```

---

## Cloudflare Pages env vars — complete list

Set all of these in Cloudflare Pages → Settings → Environment Variables → Production:

| Variable | Value | Required? |
|---|---|---|
| `SA_EMAIL` | `tesknota-sheets@singular-cache-491415-q6.iam.gserviceaccount.com` | Yes |
| `SA_KEY` | Full private key including BEGIN/END lines | Yes |
| `SPREADSHEET_ID` | `1QUUSvFZvLvdS6b9XZgRfO1JKyqGKWMi4j7HiZuHOyas` | Yes |
| `ANTHROPIC_API_KEY` | Your Anthropic key (sk-ant-...) | No — chatbot shows "coming soon" without it |
| `VISION_API_KEY` | Google Cloud Vision API key | No — scan shows setup prompt without it |
| `WORKER_URL` | URL of deployed fetch-metadata Cloudflare Worker | No — link import falls back to slug parsing without it |

---

## Manual setup steps remaining for Kiana

These cannot be done by Claude Code. Do them in this order:

**Already done:**
- [x] Google Cloud project created (`singular-cache-491415-q6`)
- [x] Sheets API enabled
- [x] Service account created (`tesknota-sheets@...`)
- [x] Sheet created and shared with service account
- [x] Tabs seeded (users, fragrances, compliments)
- [x] `config.js` has valid SA_EMAIL, SA_KEY, SPREADSHEET_ID

**Still to do:**

**A — Cloudflare Worker (for link import)**
1. Go to dash.cloudflare.com → Workers & Pages → Create → Worker
2. Name: `tesknota-fetch-metadata`
3. Paste the worker code from `worker/fetch-metadata.js` in this repo
4. Click Deploy
5. Copy the worker URL
6. Add `WORKER_URL` env var to Cloudflare Pages settings
7. Redeploy Pages app

**B — Google Vision API key (for bottle scan)**
1. Go to console.cloud.google.com → project `singular-cache-491415-q6`
2. APIs & Services → Library → "Cloud Vision API" → Enable
3. APIs & Services → Credentials → Create Credentials → API Key
4. Copy the key → Restrict to Vision API only
5. Add `VISION_API_KEY` env var to Cloudflare Pages settings
6. Also add to local `config.js` for testing
7. Redeploy Pages app

**C — Anthropic API key (for chatbot)**
1. Go to console.anthropic.com → API Keys → Create Key
2. Add `ANTHROPIC_API_KEY` env var to Cloudflare Pages settings
3. Also add to local `config.js` for testing

**D — GitHub repo + Cloudflare Pages**
1. Create private repo: github.com/saturdaythings/tesknota
2. Push all files
3. Connect to Cloudflare Pages (build command: `node build.js`, output: `/`)
4. Add all env vars from the table above
5. Deploy

---

## QA checklist — complete

### Identity and auth
- [ ] config.js loads before any app code runs
- [ ] Identity picker appears on first visit with no localStorage
- [ ] Kiana and Sylvia buttons both work and store correct userId
- [ ] Return visit skips picker and loads correct user's data
- [ ] Sign out clears localStorage and shows identity screen
- [ ] loadAllData() reads all 3 tabs from Google Sheets in parallel

### Fragrances
- [ ] Adding a fragrance appends to Google Sheets fragrances tab
- [ ] Editing a fragrance rewrites the fragrances tab correctly
- [ ] Removing a fragrance removes from sheet, preserves compliments
- [ ] Status change writes to sheet immediately
- [ ] Topbar "Add Fragrance" pre-selects Current
- [ ] Wishlist page "Add to Wishlist" pre-selects Want to Buy
- [ ] All filter chips on Collection and Wishlist actually filter rows
- [ ] Collection table and grid view both respect filters
- [ ] Detail panel opens from every fragrance row, card, and performer card
- [ ] Status change strip in detail panel works and writes to sheet

### Compliments
- [ ] Logging a compliment appends to Google Sheets compliments tab
- [ ] Compliment modal shows only Current and Previously Owned fragrances
- [ ] Secondary fragrance dropdown excludes the primary selection
- [ ] Date is month/year dropdowns not free text
- [ ] Deleting a compliment rewrites the compliments tab
- [ ] Filter chips on Compliments page actually filter rows
- [ ] Fragrance names in compliment list click through to detail panel

### Friend and social
- [ ] Friend profile shows other user's real data from state
- [ ] myFragrances() returns only current user's rows
- [ ] friendFragrances() returns only the other user's rows
- [ ] In Common section computes dynamically from both users' data
- [ ] Wishlist In Common computes dynamically
- [ ] Compare overlay shows real stats and merged timeline from state

### Analytics
- [ ] All stat numbers compute from state (no hardcoded values)
- [ ] Bar charts show real values with numbers on bars
- [ ] Notes intelligence grid computes from state.fragrances + state.compliments
- [ ] Clicking a note chip filters collection to matching fragrances
- [ ] Favourite notes chips reflect actual collection

### Import — Paste a Link
- [ ] With WORKER_URL set: fetches real metadata from Fragrantica
- [ ] Without WORKER_URL: falls back to slug parsing with clear label
- [ ] Result card shows name, house, notes, rating
- [ ] Add to Collection opens Step 2 modal with data pre-filled
- [ ] Add to Wishlist saves directly and shows in wishlist
- [ ] Discard clears the input field

### Import — Scan
- [ ] With VISION_API_KEY set: camera opens on tap
- [ ] Rear camera used on mobile (facingMode: environment)
- [ ] Capture sends image to Vision API
- [ ] Identified fragrance shows confirmation card
- [ ] Add to Collection opens Step 2 modal with data pre-filled
- [ ] Rescan resets camera view
- [ ] Not identified shows fallback with detected text
- [ ] Without VISION_API_KEY: shows setup prompt, not an error

### Import — CSV
- [ ] Drop zone accepts .csv files
- [ ] CSV parsed client-side with header detection
- [ ] Duplicate detection flags already-owned fragrances
- [ ] Import Selected appends only unchecked non-duplicate rows
- [ ] After import navigates to collection
- [ ] Download template generates a valid CSV template

### Command palette
- [ ] Opens with Cmd+K on Mac, Ctrl+K on Windows
- [ ] Opens with floating Actions button
- [ ] Closes with Escape or clicking outside
- [ ] Search box filters actions by label
- [ ] All 9 flows complete without JS errors
- [ ] Back button on every step returns to previous step
- [ ] Back on step 1 returns to action menu
- [ ] Step N of N shown correctly
- [ ] Confirm step shows correct summary of all answers
- [ ] Danger confirm shows red button and warning text
- [ ] frag-add saves to Google Sheets fragrances tab
- [ ] frag-edit saves to Google Sheets fragrances tab
- [ ] frag-status saves to Google Sheets fragrances tab
- [ ] frag-delete removes from Google Sheets fragrances tab
- [ ] comp-log saves to Google Sheets compliments tab
- [ ] comp-edit saves to Google Sheets compliments tab
- [ ] comp-delete removes from Google Sheets compliments tab
- [ ] wish-add saves to Google Sheets fragrances tab
- [ ] wish-promote updates status in Google Sheets

### Chatbot
- [ ] Without ANTHROPIC_API_KEY: shows "Coming soon" message
- [ ] With key: intent parsing calls Anthropic API
- [ ] LOG_COMPLIMENT action appends to sheets
- [ ] ADD_FRAGRANCE action appends to sheets
- [ ] UPDATE_RATING action writes to sheets
- [ ] Answers collection questions from state

### Sync and reliability
- [ ] Sync dot shows Saving during sheet writes
- [ ] Sync dot shows Synced after write completes
- [ ] Sync dot shows Error on write failure with toast message
- [ ] Sidebar counts update after every add/delete
- [ ] renderCurrentPage() called after every mutation
- [ ] Both users can use simultaneously (last-write-wins is acceptable)

### Deployment
- [ ] python3 -m http.server 8080 works locally with real Google Sheets data
- [ ] node build.js with env vars writes correct config.js
- [ ] Deploys to Cloudflare Pages successfully
- [ ] Cloudflare Worker deployed and WORKER_URL env var set
- [ ] Definition bar visible at bottom of every page
- [ ] Mobile nav covers all 5 tabs
- [ ] Works on iPhone Safari (test with Kiana and Sylvia)
- [ ] Export downloads real CSV from current state

---

## Claude Code prompt — paste this exactly to start the build

```
Read README.md completely before touching anything. Then audit every file in this repo.

Project: tęsknota — private 2-user fragrance tracker for Kiana and Sylvia.
Architecture: single index.html + Google Sheets backend + Cloudflare Pages.
Reference: github.com/saturdaythings/ATS-HRIS — mirror this pattern exactly.
Design source of truth: tesknota-prototype.html — wire it, do not redesign it.

SETUP STATUS: Already complete. The Google Sheet exists, config.js has valid
credentials, and tabs are seeded. Do not run setup-sheets.js again.

Build in this exact order. Complete each step fully. Tell me what was built
and what is next after each step. Run a syntax check before every commit.

STEP 1 — Scaffold
Copy tesknota-prototype.html to index.html.
Confirm it opens cleanly: python3 -m http.server 8080

STEP 2 — Auth and Sheets helpers
Add getAccessToken() — copy verbatim from github.com/saturdaythings/ATS-HRIS.
Add readSheet(), writeSheet(), appendRow(), loadAllData() exactly as specced in README.md.
Define FRAG_HEADERS and COMP_HEADERS constants.

STEP 3 — Identity screen
First visit: show identity screen (already in prototype as #identityScreen).
On name click: find user in state.users, store in localStorage.currentUser, show app.
Return visits: skip screen, go straight to app.
Settings Sign Out: clear localStorage, show screen.

STEP 4 — Replace hardcoded data with state
Remove hardcoded FRAGRANCES and COMPLIMENTS seed arrays.
Call loadAllData() on init. Show loading spinner while fetching.
Wire myFragrances(), friendFragrances(), myCompliments(), friendCompliments(), getFriend().
All render functions read from state not from local arrays.

STEP 5 — Wire all saves to Google Sheets
Follow the wiring spec in README.md exactly for every mutation:
saveFragrance, saveCompliment, deleteCompliment, confirmRemove, changeStatus,
importToCollection, importToWishlist, confirmBulkImport,
and all 9 command palette onSave handlers.
Sync dot must show Saving/Synced/Error via setSyncState().

STEP 6 — Wire friend profile and compare
friendFragrances() and friendCompliments() scope to the other userId.
All friend tabs read from these. In Common computes dynamically.
Compare overlay reads real compliment data from state for both users.

STEP 7 — Wire analytics and notes intelligence
All stats, charts, notes intelligence compute from state at render time.
No hardcoded numbers anywhere in the app.

STEP 8 — Implement real link import
Replace simLink() with fetchLink() as specced in README.md.
If WORKER_URL is set: POST to worker, show real metadata.
If WORKER_URL is empty: parse name and house from URL slug, show with "verify" label.
Create worker/fetch-metadata.js with the full worker code from README.md.

STEP 9 — Implement real bottle scan
Replace simScan() with startScan() / captureAndIdentify() as specced in README.md.
If VISION_API_KEY is set: open camera, capture, call Vision API, show result.
If VISION_API_KEY is empty: show setup prompt.
Update the cam panel HTML to include video element and capture button.

STEP 10 — Chatbot stub
Show "Coming soon — add Anthropic API key in config.js to enable" in the chat panel.
Leave callAnthropic() stubbed with a comment showing the full implementation from README.md.

STEP 11 — Local end-to-end test
Full flow: open app → pick Kiana → add a fragrance via modal → confirm in Google Sheet.
Add via command palette → confirm in sheet.
Log a compliment → confirm in sheet.
Open second tab → pick Sylvia → confirm Kiana's data appears in friend profile.

STEP 12 — Cloudflare deployment
Verify node build.js works with env vars.
Write ARCHITECTURE.md with complete deployment steps.

Do not add frameworks, npm packages, or servers.
Vanilla JS only. Single file. Exact ATS-HRIS pattern.
```

---

## How to resume with Claude (chat)

After Claude Code has built some or all of the app, paste into this chat:

> "I have been building tęsknota with Claude Code — single HTML file, Google Sheets backend, ATS-HRIS pattern. Current state: [paste index.html or describe what's done and what's broken]. I need help with [specific issue]. Full spec is in README.md in the repo."
