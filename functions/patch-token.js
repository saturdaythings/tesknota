// Cloudflare Pages Function: POST /patch-token
// Receives { tokenName, value }, validates admin session, patches app/globals.css on GitHub.

const REPO = 'oliver-chase/tesknota';
const BRANCH = 'main';
const FILE_PATH = 'app/globals.css';
const GITHUB_API = 'https://api.github.com';

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function verifySession(authHeader, supabaseUrl, supabaseAnonKey) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return { user, token };
}

async function checkAdmin(userId, token, supabaseUrl, supabaseAnonKey) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=is_admin`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length > 0 && rows[0].is_admin === true;
}

function decodeBase64(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function patchToken(css, tokenName, newValue) {
  // Escape special regex chars in token name
  const escaped = tokenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match exactly: optional indent, --token-name, optional space, colon, optional space, value (no newline/semicolon), semicolon + optional trailing comment
  const pattern = new RegExp(
    `^([ \\t]*${escaped}[ \\t]*:[ \\t]*)([^;\\n]+)(;[^\\n]*)$`,
    'm'
  );
  if (!pattern.test(css)) return null;
  return css.replace(pattern, (_, prefix, _old, suffix) => `${prefix}${newValue}${suffix}`);
}

export async function onRequestOptions({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const appOrigin = env.APP_ORIGIN || 'https://tesknota.pages.dev';
  if (origin !== appOrigin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin') || '';
  const appOrigin = env.APP_ORIGIN || 'https://tesknota.pages.dev';

  if (origin !== appOrigin) {
    return json({ error: 'Forbidden' }, 403, appOrigin);
  }

  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { GITHUB_TOKEN } = env;

  if (!GITHUB_TOKEN) return json({ error: 'Server misconfiguration: GITHUB_TOKEN not set' }, 500, appOrigin);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return json({ error: 'Server misconfiguration: Supabase env vars not set' }, 500, appOrigin);

  // Verify session
  const session = await verifySession(request.headers.get('Authorization'), SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!session) return json({ error: 'Unauthorized: invalid or expired session' }, 401, appOrigin);

  // Verify admin
  const isAdmin = await checkAdmin(session.user.id, session.token, SUPABASE_URL, SUPABASE_ANON_KEY);
  if (!isAdmin) return json({ error: 'Unauthorized: admin access required' }, 401, appOrigin);

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, appOrigin);
  }

  const { tokenName, value } = body;

  if (!tokenName || typeof tokenName !== 'string') return json({ error: 'Missing tokenName' }, 400, appOrigin);
  if (!value || typeof value !== 'string') return json({ error: 'Missing value' }, 400, appOrigin);
  if (!/^--[\w-]+$/.test(tokenName)) return json({ error: 'tokenName must be a CSS custom property (e.g. --color-navy)' }, 400, appOrigin);
  if (value.includes('\n') || value.includes(';')) return json({ error: 'value must not contain newlines or semicolons' }, 400, appOrigin);

  // GET current file from GitHub
  const ghHeaders = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tesknota-patch-token',
  };

  const getRes = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`, {
    headers: ghHeaders,
  });

  if (!getRes.ok) {
    const detail = await getRes.text();
    return json({ error: `GitHub GET failed (${getRes.status})`, detail }, 502, appOrigin);
  }

  const fileData = await getRes.json();
  const fileSha = fileData.sha;
  const currentCss = decodeBase64(fileData.content);

  // Patch the token
  const patchedCss = patchToken(currentCss, tokenName, value);
  if (patchedCss === null) {
    return json({ error: `Token not found in globals.css: ${tokenName}` }, 422, appOrigin);
  }

  // PUT back to GitHub
  const putRes = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: { ...ghHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: `fix(design): set ${tokenName} to ${value}`,
      content: encodeBase64(patchedCss),
      sha: fileSha,
      branch: BRANCH,
    }),
  });

  if (!putRes.ok) {
    const detail = await putRes.text();
    return json({ error: `GitHub PUT failed (${putRes.status})`, detail }, 502, appOrigin);
  }

  const putData = await putRes.json();
  return json({ sha: putData.commit.sha }, 200, appOrigin);
}
