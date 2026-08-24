import type { APIRoute } from 'astro';
import { createAdminCookie, isAdminHost } from '../../../lib/admin';
import { getEnv, json, jsonError } from '../../../lib/cloudflare';

export const POST: APIRoute = async ({ request }) => {
  const env = getEnv();
  if (!isAdminHost(request, env)) return jsonError('Admin URL is not configured for this host.', 404);
  if (!env.ADMIN) return jsonError('ADMIN secret is not configured.', 503);

  const body = await request.json().catch(() => ({})) as { key?: unknown };
  if (typeof body.key !== 'string' || body.key !== env.ADMIN) return jsonError('Invalid admin key.', 401);

  return json({ ok: true }, { headers: { 'set-cookie': await createAdminCookie(env.ADMIN) } });
};
