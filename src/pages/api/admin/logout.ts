import type { APIRoute } from 'astro';
import { clearAdminCookie, isAdminHost } from '../../../lib/admin';
import { getEnv, json, jsonError } from '../../../lib/cloudflare';

export const POST: APIRoute = ({ request }) => {
  const env = getEnv();
  if (!isAdminHost(request, env)) return jsonError('Admin URL is not configured for this host.', 404);
  return json({ ok: true }, { headers: { 'set-cookie': clearAdminCookie } });
};
