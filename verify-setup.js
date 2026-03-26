// verify-setup.js
// Confirms everything is wired correctly before handing off to Claude Code
// Usage: node verify-setup.js

const https = require('https');
const crypto = require('crypto');

// ── Load config.js ────────────────────────────────────────────────────────────
const window = {};
try {
  eval(require('fs').readFileSync('./config.js', 'utf8'));
} catch (e) {
  console.error('✗ Cannot load config.js:', e.message);
  process.exit(1);
}

const SA_EMAIL      = window.__ENV__.SA_EMAIL;
const SA_KEY        = window.__ENV__.SA_KEY;
const SHEET_ID      = window.__ENV__.SPREADSHEET_ID;
const ANTHROPIC_KEY = window.__ENV__.ANTHROPIC_API_KEY;

// ── Auth (same as setup-sheets.js) ───────────────────────────────────────────
function b64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header  = b64url(JSON.stringify({ alg:'RS256', typ:'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: SA_EMAIL, scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(SA_KEY, 'base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const res = await req('POST', 'https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${header}.${payload}.${sig}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' });
  if (!res.access_token) throw new Error(JSON.stringify(res));
  return res.access_token;
}
function req(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({
      hostname: u.hostname, path: u.pathname + u.search, method,
      headers: { ...headers, 'Content-Length': body ? Buffer.byteLength(body) : 0 },
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

// ── Result tracking ───────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const ok   = msg => { console.log(`  ✓ ${msg}`); passed++; };
const fail = msg => { console.log(`  ✗ ${msg}`); failed++; };

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n── tęsknota Verification ────────────────────────────────\n');

  // 1. Config values
  console.log('[1] Config values');
  SA_EMAIL      ? ok('SA_EMAIL present')      : fail('SA_EMAIL missing');
  SA_KEY        ? ok('SA_KEY present')        : fail('SA_KEY missing');
  SHEET_ID      ? ok('SPREADSHEET_ID present') : fail('SPREADSHEET_ID missing');
  ANTHROPIC_KEY ? ok('ANTHROPIC_API_KEY present') : fail('ANTHROPIC_API_KEY missing — chatbot will not work');

  if (!SA_EMAIL || !SA_KEY || !SHEET_ID) {
    console.log('\nCannot continue — fix config.js first.\n');
    process.exit(1);
  }

  // 2. Key format
  console.log('\n[2] Private key format');
  SA_KEY.includes('-----BEGIN PRIVATE KEY-----')
    ? ok('PEM header present')
    : fail('PEM header missing — key must start with -----BEGIN PRIVATE KEY-----');
  SA_KEY.includes('-----END PRIVATE KEY-----')
    ? ok('PEM footer present')
    : fail('PEM footer missing — key must end with -----END PRIVATE KEY-----');

  // 3. Key signs correctly
  console.log('\n[3] Key validity');
  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update('test');
    sign.sign(SA_KEY);
    ok('RSA signing works — key is valid');
  } catch(e) {
    fail('RSA signing failed: ' + e.message);
    console.log('\nKey is invalid — re-paste from the JSON file.\n');
    process.exit(1);
  }

  // 4. Auth
  console.log('\n[4] Google authentication');
  let token;
  try {
    token = await getToken();
    ok('JWT signed and exchanged for access token');
  } catch(e) {
    fail('Auth failed: ' + e.message);
    console.log('  → Check: Sheets API is enabled in Google Cloud Console');
    console.log('  → Check: SA_EMAIL matches the service account exactly\n');
    process.exit(1);
  }

  // 5. Sheet access
  console.log('\n[5] Sheet access');
  const BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  let meta;
  try {
    meta = await req('GET', BASE, null, auth);
    if (meta.error) throw new Error(meta.error.message);
    ok(`Sheet accessible: "${meta.properties?.title}"`);
  } catch(e) {
    fail('Cannot read sheet: ' + e.message);
    console.log('  → Share the sheet with', SA_EMAIL, 'as Editor\n');
    process.exit(1);
  }

  // 6. Required tabs
  console.log('\n[6] Required tabs');
  const tabs = (meta.sheets || []).map(s => s.properties.title);
  for (const t of ['users','fragrances','compliments']) {
    tabs.includes(t) ? ok(`"${t}" tab exists`) : fail(`"${t}" tab missing — run node setup-sheets.js`);
  }

  // 7. Users seeded
  console.log('\n[7] Users tab');
  try {
    const res = await req('GET', `${BASE}/values/users`, null, auth);
    const rows = res.values || [];
    rows.length >= 3 ? ok(`${rows.length} rows (header + data)`) : fail(`Only ${rows.length} rows — run node setup-sheets.js`);
    const names = rows.slice(1).map(r => r[1]);
    names.includes('Kiana')  ? ok('Kiana seeded')  : fail('Kiana missing — run node setup-sheets.js');
    names.includes('Sylvia') ? ok('Sylvia seeded') : fail('Sylvia missing — run node setup-sheets.js');
  } catch(e) {
    fail('Cannot read users tab: ' + e.message);
  }

  // 8. Anthropic key format
  console.log('\n[8] Anthropic API key');
  if (!ANTHROPIC_KEY) {
    fail('ANTHROPIC_API_KEY is empty — add it to config.js for the chatbot to work');
  } else if (ANTHROPIC_KEY.startsWith('sk-ant-')) {
    ok('Key format looks correct');
  } else {
    fail('Unexpected format — should start with sk-ant-');
  }

  // Summary
  console.log('\n── Result ───────────────────────────────────────────────');
  console.log(`   Passed: ${passed}   Failed: ${failed}`);
  if (failed === 0) {
    console.log('\n✓ Everything checks out. Ready for Claude Code.\n');
  } else if (failed === 1 && !ANTHROPIC_KEY) {
    console.log('\n⚠ Only missing Anthropic key. Add it when ready — the rest is good.\n');
  } else {
    console.log('\n✗ Fix the issues above before starting Claude Code.\n');
    process.exit(1);
  }
}

main().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
