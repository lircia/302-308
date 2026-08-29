import { clearAdminCookie, isAdminHost, json, jsonError } from '../../_lib.js';

export function onRequestPost({ request, env }) {
  if (!isAdminHost(request, env)) return jsonError('Admin URL is not configured for this host.', 404);
  return json({ ok: true }, { headers: { 'set-cookie': clearAdminCookie } });
}
