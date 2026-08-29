import { isAdminRequest, json, jsonError, normalizeDomain, validateTargetUrl } from '../../_lib.js';

async function authorize(request, env) {
  return await isAdminRequest(request, env) ? env : null;
}

export async function onRequestGet({ request, env }) {
  const authorized = await authorize(request, env);
  if (!authorized) return jsonError('Admin login is required.', 401);
  if (!authorized.DB) return jsonError('D1 binding DB is not configured.', 503);
  const result = await authorized.DB.prepare('SELECT domain, target_url, created_at FROM redirects ORDER BY domain ASC').all();
  return json({ ok: true, redirects: result.results ?? [] });
}

export async function onRequestPost({ request, env }) {
  const authorized = await authorize(request, env);
  if (!authorized) return jsonError('Admin login is required.', 401);
  if (!authorized.DB) return jsonError('D1 binding DB is not configured.', 503);
  const body = await request.json().catch(() => ({}));
  const domain = typeof body.domain === 'string' ? normalizeDomain(body.domain) : null;
  const targetUrl = typeof body.targetUrl === 'string' ? validateTargetUrl(body.targetUrl) : null;
  if (!domain) return jsonError('访问域名格式不正确，只能填写域名，不要包含协议、端口或路径。');
  if (!targetUrl) return jsonError('重定向 URL 必须是完整的 http 或 https URL。');
  const existing = await authorized.DB.prepare('SELECT domain FROM redirects WHERE domain = ?1').bind(domain).first();
  if (existing) return jsonError('该访问域名已经存在。', 409);
  await authorized.DB.prepare('INSERT INTO redirects (domain, target_url) VALUES (?1, ?2)').bind(domain, targetUrl).run();
  return json({ ok: true, domain, targetUrl }, { status: 201 });
}

export async function onRequestDelete({ request, env }) {
  const authorized = await authorize(request, env);
  if (!authorized) return jsonError('Admin login is required.', 401);
  if (!authorized.DB) return jsonError('D1 binding DB is not configured.', 503);
  const body = await request.json().catch(() => ({}));
  const domain = typeof body.domain === 'string' ? normalizeDomain(body.domain) : null;
  if (!domain) return jsonError('访问域名格式不正确。');
  await authorized.DB.prepare('DELETE FROM redirects WHERE domain = ?1').bind(domain).run();
  return json({ ok: true, domain });
}
