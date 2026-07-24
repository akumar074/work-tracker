/**
 * GitHub Gist sync utility.
 *
 * Stores one private Gist that holds a single file "work-tracker-data.json"
 * containing all app data. The Gist ID and PAT are kept in localStorage so
 * they survive page reloads (they never leave the browser).
 *
 * API calls go directly to api.github.com (or a configured GHE host)
 * using the user's Personal Access Token (gist scope required).
 */

const LS_PAT          = 'wt_gist_pat';
const LS_GIST_ID      = 'wt_gist_id';
const LS_GH_HOST      = 'wt_gist_host';      // defaults to api.github.com
const LS_LAST_PUSHED  = 'wt_gist_last_push'; // ISO timestamp of our last push
const FILENAME        = 'work-tracker-data.json';
const SCHEMA_VER      = 1;

// ── PAT / config storage ─────────────────────────────────────────────────
export function getPAT()    { return localStorage.getItem(LS_PAT)     || ''; }
export function getGistId() { return localStorage.getItem(LS_GIST_ID) || ''; }
export function getGHHost() { return localStorage.getItem(LS_GH_HOST) || 'api.github.com'; }

export function savePAT(pat)      { localStorage.setItem(LS_PAT,     pat); }
export function saveGistId(id)    { localStorage.setItem(LS_GIST_ID, id); }
export function saveGHHost(host)  { localStorage.setItem(LS_GH_HOST, host); }

export function getLastPushedAt()  { return localStorage.getItem(LS_LAST_PUSHED) || null; }
export function saveLastPushedAt() { localStorage.setItem(LS_LAST_PUSHED, new Date().toISOString()); }

export function clearGistConfig() {
  localStorage.removeItem(LS_PAT);
  localStorage.removeItem(LS_GIST_ID);
  localStorage.removeItem(LS_GH_HOST);
  localStorage.removeItem(LS_LAST_PUSHED);
}

export function isConnected() { return !!(getPAT() && getGistId()); }

// ── HTTP helper ──────────────────────────────────────────────────────────
function apiUrl(path) {
  const host = getGHHost().replace(/\/$/, '');
  // GHE uses https://<host>/api/v3, github.com uses https://api.github.com
  if (host === 'api.github.com') return `https://api.github.com${path}`;
  return `https://${host}/api/v3${path}`;
}

async function ghFetch(method, path, body) {
  const pat = getPAT();
  if (!pat) throw new Error('No PAT configured.');

  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Accept':        'application/vnd.github+json',
      'Content-Type':  'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Gist operations ──────────────────────────────────────────────────────

/** Verify PAT works and return { login, avatar_url }. */
export async function verifyPAT() {
  const user = await ghFetch('GET', '/user');
  return { login: user.login, avatar: user.avatar_url };
}

/**
 * Create a new private Gist with the current data.
 * Saves the returned Gist ID to localStorage and returns it.
 */
export async function createGist(data) {
  const gist = await ghFetch('POST', '/gists', {
    description: 'Work Tracker backup (auto-managed)',
    public: false,
    files: {
      [FILENAME]: { content: serializeData(data) },
    },
  });
  saveGistId(gist.id);
  return gist.id;
}

/**
 * Push current data to an existing Gist (PATCH).
 * Creates a new Gist if no ID is stored yet.
 * Records lastPushedAt in localStorage after success.
 */
export async function pushToGist(data) {
  let id = getGistId();
  if (!id) {
    id = await createGist(data);
    saveLastPushedAt();
    return id;
  }
  await ghFetch('PATCH', `/gists/${id}`, {
    files: {
      [FILENAME]: { content: serializeData(data) },
    },
  });
  saveLastPushedAt();
  return id;
}

/**
 * Fetch only the Gist metadata (no file content) to cheaply check
 * whether the remote has changed since our last push.
 * Returns { updatedAt: ISO string } or throws.
 */
export async function getGistMeta() {
  const id = getGistId();
  if (!id) throw new Error('No Gist ID configured.');
  const gist = await ghFetch('GET', `/gists/${id}`);
  return { updatedAt: gist.updated_at };
}

/**
 * Pull data from the stored Gist.
 * Returns { workEntries, events, todos, pushedAt } or throws.
 */
export async function pullFromGist() {
  const id = getGistId();
  if (!id) throw new Error('No Gist ID configured. Push first to create one.');

  const gist = await ghFetch('GET', `/gists/${id}`);
  const raw  = gist.files?.[FILENAME]?.content;
  if (!raw) throw new Error(`File "${FILENAME}" not found in Gist.`);

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.workEntries) ||
      !Array.isArray(parsed.events)      ||
      !Array.isArray(parsed.todos)) {
    throw new Error('Gist data is corrupt or from an incompatible version.');
  }
  return {
    workEntries: parsed.workEntries,
    events:      parsed.events,
    todos:       parsed.todos,
    pushedAt:    parsed.pushedAt ?? null,
  };
}

/**
 * Connect to an *existing* Gist by its ID (for restoring on a new device).
 * Validates the Gist is accessible and contains the expected file.
 */
export async function connectToExistingGist(gistId) {
  const gist = await ghFetch('GET', `/gists/${gistId}`);
  if (!gist.files?.[FILENAME]) {
    throw new Error(`Gist "${gistId}" exists but has no "${FILENAME}" file.`);
  }
  saveGistId(gistId);
  return gistId;
}

// ── Serialise ────────────────────────────────────────────────────────────
function serializeData({ workEntries, events, todos }) {
  return JSON.stringify({
    schemaVersion: SCHEMA_VER,
    pushedAt:      new Date().toISOString(),
    workEntries,
    events,
    todos,
  }, null, 2);
}
