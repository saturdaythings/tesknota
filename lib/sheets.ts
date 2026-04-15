// Google Sheets API client — ported from js/auth.js + js/sheets.js
// Runs client-side only (static export). Credentials baked in at build time via NEXT_PUBLIC_ env vars.

const SA_EMAIL = process.env.NEXT_PUBLIC_SA_EMAIL ?? "";
const SA_KEY = process.env.NEXT_PUBLIC_SA_KEY ?? "";
const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID ?? "";
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

let _tokenCache: { token: string | null; exp: number } = { token: null, exp: 0 };

function b64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemToBytes(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (_tokenCache.token && now < _tokenCache.exp - 60) return _tokenCache.token;

  if (!SA_EMAIL || !SA_KEY) throw new Error("Missing SA credentials");

  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(
    enc.encode(
      JSON.stringify({
        iss: SA_EMAIL,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    )
  );

  const sigInput = enc.encode(`${header}.${claim}`);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(SA_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, sigInput);
  const jwt = `${header}.${claim}.${b64url(new Uint8Array(sigBuf))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Token error: ${(e as { error_description?: string }).error_description ?? res.status}`);
  }
  const d = await res.json();
  _tokenCache = { token: d.access_token, exp: now + d.expires_in };
  return d.access_token;
}

export async function readSheet(tabName: string): Promise<Record<string, string>[]> {
  const token = await getAccessToken();
  const res = await fetch(`${SHEETS_BASE}/values/${encodeURIComponent(tabName)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error(`[sheets] read failed for "${tabName}":`, res.status, errBody);
    throw new Error(`Sheet read error ${res.status} for ${tabName}`);
  }
  const data = await res.json();
  const rows: string[][] = data.values ?? [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
}

export async function writeSheet(
  tabName: string,
  rows: Record<string, unknown>[],
  headers: string[]
): Promise<void> {
  const token = await getAccessToken();
  const authHeader = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const r1 = await fetch(`${SHEETS_BASE}/values/${tabName}:clear`, {
    method: "POST",
    headers: authHeader,
  });
  if (!r1.ok) throw new Error(`Sheet clear failed [${tabName}]: ${r1.status}`);
  if (!rows.length) return;

  const values = [headers].concat(
    rows.map((row) =>
      headers.map((h) => {
        const v = row[h];
        if (v === null || v === undefined) return "";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v);
      })
    )
  );
  const r2 = await fetch(`${SHEETS_BASE}/values/${tabName}?valueInputOption=RAW`, {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify({ values }),
  });
  if (!r2.ok) throw new Error(`Sheet write failed [${tabName}]: ${r2.status}`);
}

export async function appendRow(
  tabName: string,
  row: Record<string, unknown>,
  headers: string[]
): Promise<void> {
  const token = await getAccessToken();
  const values = [
    headers.map((h) => {
      const v = row[h];
      if (v === null || v === undefined) return "";
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
    }),
  ];
  const res = await fetch(
    `${SHEETS_BASE}/values/${tabName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) throw new Error(`Sheet append failed [${tabName}]: ${res.status}`);
}

export async function ensureSheetTab(tabName: string, headers: string[]): Promise<void> {
  try {
    await readSheet(tabName);
  } catch {
    const token = await getAccessToken();
    const batchRes = await fetch(`${SHEETS_BASE}:batchUpdate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName } } }] }),
    });
    if (!batchRes.ok) {
      console.error(`[ensureSheetTab] addSheet failed for "${tabName}":`, batchRes.status);
      return;
    }
    const hrow: Record<string, string> = {};
    headers.forEach((h) => { hrow[h] = h; });
    await appendRow(tabName, hrow, headers);
  }
}
