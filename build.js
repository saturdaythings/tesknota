// build.js
// Cloudflare Pages build script — runs at deploy time
// Writes config.js from environment variables set in Cloudflare dashboard
// Build command: node build.js
// Output directory: /

const fs = require('fs');

const email         = process.env.SA_EMAIL;
const key           = (process.env.SA_KEY || '').replace(/\\n/g, '\n');
const spreadsheetId = process.env.SPREADSHEET_ID;
const anthropicKey  = process.env.ANTHROPIC_API_KEY || '';

if (!email || !key || !spreadsheetId) {
  console.error('Missing required env vars: SA_EMAIL, SA_KEY, SPREADSHEET_ID');
  process.exit(1);
}

fs.writeFileSync('config.js', `window.__ENV__=${JSON.stringify({
  SA_EMAIL: email,
  SA_KEY: key,
  SPREADSHEET_ID: spreadsheetId,
  ANTHROPIC_API_KEY: anthropicKey,
})};`);

console.log('config.js written');
console.log('SA_EMAIL:', email);
console.log('Key length:', key.length);
