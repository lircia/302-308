import type { AppEnv } from './cloudflare';
import { normalizeHostname } from './redirect';

const SESSION_COOKIE = 'domain_redirect_admin';
const SESSION_MESSAGE = 'domain-redirect-admin-session-v1';

function adminHostname(env: AppEnv): string | null {
  const configuredUrl = env.URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl.includes('://') ? configuredUrl : `https://${configuredUrl}`);
    return normalizeHostname(url.hostname);
  } catch {
    return null;
  }
}

export function isAdminHost(request: Request, env: AppEnv): boolean {
  const configuredHostname = adminHostname(env);
  if (!configuredHostname) return false;
  return normalizeHostname(new URL(request.url).hostname) === configuredHostname;
}

async function sessionToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(SESSION_MESSAGE),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('cookie')?.split(';') ?? [];
  for (const item of cookies) {
    const [key, ...value] = item.trim().split('=');
    if (key === name) return value.join('=') || null;
  }
  return null;
}

export async function isAdminRequest(request: Request, env: AppEnv): Promise<boolean> {
  if (!isAdminHost(request, env) || !env.ADMIN) return false;
  return getCookie(request, SESSION_COOKIE) === await sessionToken(env.ADMIN);
}

export async function createAdminCookie(secret: string): Promise<string> {
  const token = await sessionToken(secret);
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`;
}

export const clearAdminCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
