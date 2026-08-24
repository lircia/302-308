import { env as cloudflareEnv } from 'cloudflare:workers';

export interface AppEnv {
  DB?: D1Database;
  URL?: string;
  ADMIN?: string;
}

export function getEnv(): AppEnv {
  return {
    ...(import.meta.env as AppEnv),
    ...(cloudflareEnv as unknown as AppEnv),
  };
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function jsonError(message: string, status = 400): Response {
  return json({ ok: false, error: message }, { status });
}

export function text(message: string, status: number): Response {
  return new Response(`${message}\n`, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
