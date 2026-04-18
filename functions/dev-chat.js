// Cloudflare Pages Function: POST /dev-chat
// Admin-only developer assistant with GitHub read/write tools via Claude tool_use

const REPO = 'oliver-chase/tesknota';
const BRANCH = 'main';
const GITHUB_API = 'https://api.github.com';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT =
  'You are a developer assistant for the t\u0119sknota codebase hosted at github.com/oliver-chase/tesknota. ' +
  'You can read files, propose code changes, write commits, and push to the main branch using the GitHub API. ' +
  'Always confirm the change with the admin before pushing. Show diffs before applying. ' +
  'When reading files, quote relevant sections in your reply. ' +
  'When proposing changes, show a clear before/after diff and wait for explicit admin approval before calling push_commit.';

const TOOLS = [
  {
    name: 'read_file',
    description:
      'Reads a file from the tesknota repository on GitHub (main branch). Returns the full file content. Use this to understand existing code before proposing changes.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The file path in the repository, e.g. "app/(app)/admin/page.tsx" or "lib/data/index.ts"',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'push_commit',
    description:
      'Creates or updates a file in the tesknota repository and pushes a commit to the main branch. Only call this after explicit admin confirmation. Always show the diff first.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to create or update' },
        content: { type: 'string', description: 'The full new content of the file' },
        message: { type: 'string', description: 'The git commit message' },
      },
      required: ['path', 'content', 'message'],
    },
  },
];

// ── Base64 helpers ────────────────────────────────────────────────────────────

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

// ── GitHub helpers ────────────────────────────────────────────────────────────

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tesknota-dev-bot',
  };
}

async function readFile(path, githubToken) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${encodedPath}?ref=${BRANCH}`, {
    headers: ghHeaders(githubToken),
  });
  if (!res.ok) {
    const detail = await res.text();
    return `Error reading ${path}: HTTP ${res.status} — ${detail}`;
  }
  const data = await res.json();
  if (Array.isArray(data)) return `${path} is a directory, not a file.`;
  return decodeBase64(data.content);
}

async function pushCommit(path, content, message, githubToken) {
  const headers = { ...ghHeaders(githubToken), 'Content-Type': 'application/json' };
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  // Get current SHA if file exists
  const getRes = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${encodedPath}?ref=${BRANCH}`, {
    headers: ghHeaders(githubToken),
  });
  let sha;
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  }

  const putRes = await fetch(`${GITHUB_API}/repos/${REPO}/contents/${encodedPath}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    const detail = await putRes.text();
    return `Error pushing commit: HTTP ${putRes.status} — ${detail}`;
  }
  const data = await putRes.json();
  return `Committed successfully. SHA: ${data.commit.sha}`;
}

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(name, input, githubToken) {
  if (name === 'read_file') {
    return await readFile(input.path, githubToken);
  }
  if (name === 'push_commit') {
    return await pushCommit(input.path, input.content, input.message, githubToken);
  }
  return `Unknown tool: ${name}`;
}

// ── Claude tool-use loop ──────────────────────────────────────────────────────

async function runClaudeLoop(messages, anthropicKey, githubToken) {
  let loopMessages = [...messages];

  for (let iter = 0; iter < 10; iter++) {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8096,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: loopMessages,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return `Anthropic API error: ${res.status} — ${detail}`;
    }

    const resp = await res.json();

    if (resp.stop_reason === 'end_turn') {
      const text = resp.content?.find((b) => b.type === 'text');
      return text?.text ?? 'No reply';
    }

    if (resp.stop_reason === 'tool_use') {
      loopMessages.push({ role: 'assistant', content: resp.content });

      const toolResults = [];
      for (const block of resp.content) {
        if (block.type !== 'tool_use') continue;
        const result = await executeTool(block.name, block.input, githubToken);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
      loopMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Unexpected stop reason — extract any text and return
    const text = resp.content?.find((b) => b.type === 'text');
    return text?.text ?? `Stopped: ${resp.stop_reason}`;
  }

  return 'Maximum tool iterations reached.';
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function verifyAdminSession(authHeader, supabaseUrl, supabaseAnonKey) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey },
  });
  if (!userRes.ok) return null;
  const { id: userId } = await userRes.json();

  const profileRes = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=is_admin`,
    { headers: { Authorization: `Bearer ${token}`, apikey: supabaseAnonKey } }
  );
  if (!profileRes.ok) return null;
  const rows = await profileRes.json();
  if (!Array.isArray(rows) || !rows[0]?.is_admin) return null;

  return userId;
}

// ── Request handler ───────────────────────────────────────────────────────────

function jsonResponse(data, status, appOrigin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': appOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
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

  const fn = (data, status = 200) => jsonResponse(data, status, appOrigin);

  const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;
  const GITHUB_TOKEN = env.GITHUB_TOKEN;

  if (!ANTHROPIC_KEY) return fn({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
  if (!GITHUB_TOKEN) return fn({ error: 'GITHUB_TOKEN not configured' }, 500);
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return fn({ error: 'Supabase env not configured' }, 500);

  const userId = await verifyAdminSession(
    request.headers.get('Authorization'),
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  if (!userId) return fn({ error: 'Admin authentication required' }, 401);

  let body;
  try { body = await request.json(); } catch { return fn({ error: 'Invalid JSON' }, 400); }

  const { message, history = [] } = body;
  if (!message || typeof message !== 'string') return fn({ error: 'Missing message' }, 400);
  if (!Array.isArray(history)) return fn({ error: 'history must be an array' }, 400);

  // Build Claude message list from client history + current message
  const messages = [
    ...history
      .filter((h) => h.role === 'user' || h.role === 'assistant')
      .map((h) => ({ role: h.role, content: String(h.content) })),
    { role: 'user', content: message },
  ];

  const reply = await runClaudeLoop(messages, ANTHROPIC_KEY, GITHUB_TOKEN);

  return fn({ reply });
}
