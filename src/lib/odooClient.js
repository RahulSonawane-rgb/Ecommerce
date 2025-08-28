// Lightweight Odoo JSON-RPC client for browser usage.
// For production, proxy these calls through a secure Node server to protect credentials.

// Use Vite proxy in dev to avoid CORS: requests go to /odoo/jsonrpc → proxied to Odoo
const ODOO_URL = import.meta.env.VITE_ODOO_URL || '';
const ODOO_DB = import.meta.env.VITE_ODOO_DB;
const ODOO_LOGIN = import.meta.env.VITE_ODOO_LOGIN;
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY;

const JSON_RPC_PATH = '/jsonrpc';

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
  const url = joinUrl(ODOO_URL, endpoint);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cachedSession.csrfToken ? { 'X-CSRFToken': cachedSession.csrfToken } : {}),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), ...body }),
    ...options,
  });
  const json = await response.json();
  if (json.error) {
    const message = json.error.data?.message || json.error.message || 'Odoo JSON-RPC error';
    throw new Error(message);
  }
  return json.result;
}

export async function authenticate() {
  if (cachedSession.uid) return cachedSession;
  // Prefer API key through /web/session/authenticate where supported (Odoo 15+)
  const params = {
    service: 'common',
    method: 'authenticate',
    args: [ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {}],
  };
  const result = await jsonRpc(JSON_RPC_PATH, { method: 'call', params });
  if (!result || !result.uid) {
    throw new Error('Failed to authenticate with Odoo');
  }
  cachedSession.uid = result.uid;
  cachedSession.context = result.user_context || {};
  return cachedSession;
}

export async function callKw(model, method, args = [], kwargs = {}) {
  await authenticate();
  const params = {
    service: 'object',
    method: 'execute_kw',
    args: [ODOO_DB, cachedSession.uid, ODOO_API_KEY, model, method, args, kwargs],
  };
  return jsonRpc(JSON_RPC_PATH, { method: 'call', params });
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

 