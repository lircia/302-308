import { createAdminCookie, isAdminHost, json, jsonError } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  if (!isAdminHost(request, env)) return jsonError('Admin URL is not configured for this host.', 404);
  if (!env.ADMIN) return jsonError('ADMIN secret is not configured.', 503);
  const body = await request.json().catch(() => ({}));
  if (typeof body.key !== 'string' || body.key !== env.ADMIN) return jsonError('Invalid admin key.', 401);
  return json({ ok: true }, { headers: { 'set-cookie': await createAdminCookie(env.ADMIN) } });
}
