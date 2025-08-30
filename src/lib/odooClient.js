// Lightweight Odoo JSON-RPC client for browser usage.
// For production, proxy these calls through a secure Node server to protect credentials.

// Use secure Node backend proxy at /api
const JSON_RPC_PROXY = '/api/odoo/execute_kw';
const AUTH_PROXY = '/api/odoo/authenticate';

function joinUrl(base, path) {
  if (!base) return `/odoo${path}`; // dev proxy
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}${path}`;
}

let cachedSession = {
  uid: null,
  context: null,
  csrfToken: null,
};

async function jsonRpc(endpoint, body, options = {}) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Odoo proxy error');
  }
  return json;
}

export async function authenticate() {
  if (cachedSession.uid) return cachedSession;
  const result = await jsonRpc(AUTH_PROXY, {});
  if (!result || !result.uid) {
    throw new Error('Failed to authenticate with Odoo');
  }
  cachedSession.uid = result.uid;
  cachedSession.context = result.context || {};
  return cachedSession;
}

export async function callKw(model, method, args = [], kwargs = {}) {
  await authenticate();
  const { result } = await jsonRpc(JSON_RPC_PROXY, { model, method, args, kwargs });
  return result;
}

export const OdooClient = {
  authenticate,
  callKw,
};

// Generic helpers
export async function searchRead(model, domain = [], fields = [], limit = 80, offset = 0, order) {
  return callKw(model, 'search_read', [domain], { fields, limit, offset, order });
}

export async function create(model, values) {
  return callKw(model, 'create', [[values]]);
}

export async function write(model, ids, values) {
  return callKw(model, 'write', [ids, values]);
}

export async function unlink(model, ids) {
  return callKw(model, 'unlink', [ids]);
}

 