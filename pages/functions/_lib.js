const SESSION_COOKIE = 'domain_redirect_pages_admin';
const SESSION_MESSAGE = 'domain-redirect-pages-admin-session-v1';

export function normalizeHostname(hostname) {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function configuredAdminHostname(env) {
  if (!env.URL || !env.URL.trim()) return null;
  try {
    const configured = env.URL.includes('://') ? env.URL : `https://${env.URL}`;
    return normalizeHostname(new URL(configured).hostname);
  } catch {
    return null;
  }
}

export function isAdminHost(request, env) {
  const configured = configuredAdminHostname(env);
  return Boolean(configured && normalizeHostname(new URL(request.url).hostname) === configured);
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('x-domain-redirect-pages', '302-308');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function jsonError(message, status = 400) {
  return json({ ok: false, error: message }, { status });
}

export function text(message, status) {
  return new Response(`${message}\n`, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'x-domain-redirect-pages': '302-308',
    },
  });
}

async function sessionToken(secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(SESSION_MESSAGE));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getCookie(request, name) {
  const cookies = request.headers.get('cookie')?.split(';') ?? [];
  for (const item of cookies) {
    const [key, ...value] = item.trim().split('=');
    if (key === name) return value.join('=') || null;
  }
  return null;
}

export async function isAdminRequest(request, env) {
  if (!isAdminHost(request, env) || !env.ADMIN) return false;
  return getCookie(request, SESSION_COOKIE) === await sessionToken(env.ADMIN);
}

export async function createAdminCookie(secret) {
  return `${SESSION_COOKIE}=${await sessionToken(secret)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`;
}

export const clearAdminCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function normalizeDomain(input) {
  const domain = normalizeHostname(input);
  if (!domain || domain.includes('/') || domain.includes('?') || domain.includes('#') || domain.includes(':')) return null;
  try {
    const parsed = new URL(`https://${domain}`);
    return parsed.hostname === domain ? domain : null;
  } catch {
    return null;
  }
}

export function validateTargetUrl(input) {
  try {
    const target = new URL(input.trim());
    return target.protocol === 'http:' || target.protocol === 'https:' ? input.trim() : null;
  } catch {
    return null;
  }
}

export async function findRedirect(hostname, env) {
  if (!env.DB) throw new Error('D1 binding DB is not configured');
  const row = await env.DB.prepare('SELECT target_url FROM redirects WHERE domain = ?1 LIMIT 1')
    .bind(normalizeHostname(hostname)).first();
  return row?.target_url ?? null;
}
