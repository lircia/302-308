import type { AppEnv } from './cloudflare';

export interface RedirectRow {
  domain: string;
  target_url: string;
  created_at: string;
}

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

export function normalizeDomain(input: string): string | null {
  const domain = normalizeHostname(input);

  if (!domain || domain.includes('/') || domain.includes('?') || domain.includes('#') || domain.includes(':')) {
    return null;
  }

  try {
    const parsed = new URL(`https://${domain}`);
    return parsed.hostname === domain ? domain : null;
  } catch {
    return null;
  }
}

export function validateTargetUrl(input: string): string | null {
  const target = input.trim();

  try {
    const parsed = new URL(target);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? target : null;
  } catch {
    return null;
  }
}

export async function findRedirect(hostname: string, env: AppEnv): Promise<string | null> {
  if (!env.DB) {
    throw new Error('D1 binding DB is not configured');
  }

  const row = await env.DB
    .prepare('SELECT target_url FROM redirects WHERE domain = ?1 LIMIT 1')
    .bind(normalizeHostname(hostname))
    .first<{ target_url: string }>();

  return row?.target_url ?? null;
}
