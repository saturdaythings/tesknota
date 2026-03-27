// setup-sheets.js
// Run ONCE to create tabs and seed users in the tęsknota Google Sheet
// Usage: node setup-sheets.js
// Requires config.js in the same folder

const https = require('https');
const crypto = require('crypto');

// ── Load config.js ────────────────────────────────────────────────────────────
const window = {};
try {
  eval(require('fs').readFileSync('./config.js', 'utf8'));
} catch (e) {
  console.error('ERROR: Cannot load config.js\n', e.message);
  process.exit(1);
}

const SA_EMAIL = window.__ENV__.SA_EMAIL;
const SA_KEY   = window.__ENV__.SA_KEY;
const SHEET_ID = window.__ENV__.SPREADSHEET_ID;

if (!SA_EMAIL || !SA_KEY || !SHEET_ID) {
  console.error('ERROR: SA_EMAIL, SA_KEY, or SPREADSHEET_ID missing from config.js');
  process.exit(1);
}

// ── Tab definitions ───────────────────────────────────────────────────────────
const now = new Date().toISOString();

const TABS = {
  users: {
    headers: ['id', 'name', 'createdAt'],
    rows: [
      ['u1', 'Kiana',  now],
      ['u2', 'Sylvia', now],
    ],
  },
  fragrances: {
    headers: [
      'id','userId','name','house','status','sizeOwned',
      'communityRating','communityLong','communitySill','avgPrice','notes',
      'personalRating','statusRating','personalLong','personalSill',
      'whereBought','purchaseDate','isDupe','dupeFor','personalNotes','createdAt',
    ],
    rows: [],
  },
  compliments: {
    headers: [
      'id','userId','primaryFragranceId','primaryFragranceName',
      'secondaryFragranceId','secondaryFragranceName','complimenterGender',
      'relation','month','year','location','notes','createdAt',
    ],
    rows: [],
  },
  community_frags: {
    headers: [
      'name','house','topNotes','middleNotes','baseNotes',
      'concentration','family','communityRating','avgPrice',
      'communityLong','communitySill','addedBy','addedAt',
    ],
    rows: [],
  },
};

// ── Auth ──────────────────────────────────────────────────────────────────────
function b64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(SA_KEY, 'base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const jwt = `${header}.${payload}.${sig}`;
  const res = await req('POST', 'https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  if (!res.access_token) throw new Error('Auth failed: ' + JSON.stringify(res));
  return res.access_token;
}

// ── HTTP ──────────────────────────────────────────────────────────────────────
function req(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, 'Content-Length': body ? Buffer.byteLength(body) : 0 },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
const auth = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n── tęsknota Sheet Setup ─────────────────────────────────');
  console.log('Sheet :', SHEET_ID);
  console.log('Email :', SA_EMAIL, '\n');

  console.log('Authenticating...');
  const token = await getToken();
  console.log('✓ Authenticated\n');

  // Get existing sheet info
  const meta = await req('GET', BASE, null, auth(token));
  if (meta.error) {
    console.error('✗ Cannot access sheet:', meta.error.message);
    console.error('  → Make sure you shared the sheet with', SA_EMAIL, 'as Editor');
    process.exit(1);
  }
  const existing = (meta.sheets || []).map(s => s.properties.title);
  console.log('Sheet name  :', meta.properties?.title);
  console.log('Existing tabs:', existing.join(', ') || '(none)', '\n');

  for (const [name, { headers, rows }] of Object.entries(TABS)) {
    process.stdout.write(`Setting up "${name}"... `);

    // Create tab if it doesn't exist
    if (!existing.includes(name)) {
      const r = await req('POST', `${BASE}:batchUpdate`,
        JSON.stringify({ requests: [{ addSheet: { properties: { title: name } } }] }),
        auth(token));
      if (r.error) throw new Error(`Cannot create tab "${name}": ${r.error.message}`);
      process.stdout.write('created, ');
    } else {
      process.stdout.write('exists, ');
    }

    // Clear and write
    await req('POST', `${BASE}/values/${name}:clear`, '{}', auth(token));
    const values = [headers, ...rows];
    await req('PUT', `${BASE}/values/${name}?valueInputOption=RAW`,
      JSON.stringify({ values }), auth(token));

    console.log(rows.length > 0 ? `✓ ${rows.length} rows written` : '✓ headers written');
  }

  console.log('\n── Done ─────────────────────────────────────────────────');
  console.log('✓ users tab       → Kiana (u1) and Sylvia (u2) seeded');
  console.log('✓ fragrances tab  → headers ready');
  console.log('✓ compliments tab → headers ready');
  console.log('\nCheck your sheet:');
  console.log(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
  console.log('\nNext step: node verify-setup.js\n');
}

if (!process.argv.includes('--community-only')) {
  main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
}

// ── community_frags only ───────────────────────────────────────────────────────
// Run: node setup-sheets.js --community-only
// Creates only the community_frags tab without touching existing data.
async function setupCommunityFragsTab() {
  console.log('\n── community_frags tab setup ────────────────────────────');
  console.log('Sheet :', SHEET_ID);
  console.log('Authenticating...');
  const token = await getToken();
  console.log('✓ Authenticated\n');

  const meta = await req('GET', BASE, null, auth(token));
  if (meta.error) { console.error('✗ Cannot access sheet:', meta.error.message); process.exit(1); }

  const existing = (meta.sheets || []).map(s => s.properties.title);
  console.log('Existing tabs:', existing.join(', '));

  if (existing.includes('community_frags')) {
    console.log('\n✓ community_frags tab already exists — nothing to do');
    return;
  }

  const headers = TABS.community_frags.headers;
  process.stdout.write('\nCreating community_frags tab... ');
  const r = await req('POST', `${BASE}:batchUpdate`,
    JSON.stringify({ requests: [{ addSheet: { properties: { title: 'community_frags' } } }] }),
    auth(token));
  if (r.error) throw new Error('Cannot create tab: ' + r.error.message);
  console.log('created');

  process.stdout.write('Writing headers... ');
  await req('PUT', `${BASE}/values/community_frags?valueInputOption=RAW`,
    JSON.stringify({ values: [headers] }), auth(token));
  console.log('✓');

  console.log('\n── Done ─────────────────────────────────────────────────');
  console.log('✓ community_frags tab created:', headers.join(', '));
  console.log('\nSheet: https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit\n');
}

if (process.argv.includes('--community-only')) {
  setupCommunityFragsTab().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
}
