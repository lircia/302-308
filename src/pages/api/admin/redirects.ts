import type { APIRoute } from 'astro';
import { isAdminRequest } from '../../../lib/admin';
import { getEnv, json, jsonError } from '../../../lib/cloudflare';
import { normalizeDomain, validateTargetUrl } from '../../../lib/redirect';

async function authorize(request: Request) {
  const env = getEnv();
  if (!(await isAdminRequest(request, env))) return { env: null, error: jsonError('Admin login is required.', 401) };
  return { env, error: null };
}

export const GET: APIRoute = async ({ request }) => {
  const { env, error } = await authorize(request);
  if (error || !env) return error;
  if (!env.DB) return jsonError('D1 binding DB is not configured.', 503);
  const result = await env.DB.prepare('SELECT domain, target_url, created_at FROM redirects ORDER BY domain ASC').all();
  return json({ ok: true, redirects: result.results ?? [] });
};

export const POST: APIRoute = async ({ request }) => {
  const { env, error } = await authorize(request);
  if (error || !env) return error;
  if (!env.DB) return jsonError('D1 binding DB is not configured.', 503);

  const body = await request.json().catch(() => ({})) as { domain?: unknown; targetUrl?: unknown };
  const domain = typeof body.domain === 'string' ? normalizeDomain(body.domain) : null;
  const targetUrl = typeof body.targetUrl === 'string' ? validateTargetUrl(body.targetUrl) : null;
  if (!domain) return jsonError('访问域名格式不正确，只能填写域名，不要包含协议、端口或路径。');
  if (!targetUrl) return jsonError('重定向 URL 必须是完整的 http 或 https URL。');

  const existing = await env.DB.prepare('SELECT domain FROM redirects WHERE domain = ?1').bind(domain).first();
  if (existing) return jsonError('该访问域名已经存在。', 409);

  await env.DB.prepare('INSERT INTO redirects (domain, target_url) VALUES (?1, ?2)').bind(domain, targetUrl).run();
  return json({ ok: true, domain, targetUrl }, { status: 201 });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { env, error } = await authorize(request);
  if (error || !env) return error;
  if (!env.DB) return jsonError('D1 binding DB is not configured.', 503);

  const body = await request.json().catch(() => ({})) as { domain?: unknown };
  const domain = typeof body.domain === 'string' ? normalizeDomain(body.domain) : null;
  if (!domain) return jsonError('访问域名格式不正确。');
  await env.DB.prepare('DELETE FROM redirects WHERE domain = ?1').bind(domain).run();
  return json({ ok: true, domain });
};
