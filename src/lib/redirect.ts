import { REDIRECTS } from '../config/redirects';

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function getTarget(hostname: string): URL | null {
  const configuredTarget = REDIRECTS[normalizeHostname(hostname)];

  if (!configuredTarget) {
    return null;
  }

  let target: URL;
  try {
    target = new URL(configuredTarget);
  } catch {
    throw new Error(`Invalid redirect target for ${hostname}`);
  }

  if (!HTTP_PROTOCOLS.has(target.protocol)) {
    throw new Error(`Redirect target for ${hostname} must use http or https`);
  }

  return target;
}

/**
 * 仅按访问域名生成重定向地址。
 * 访问 URL 的协议、路径和查询参数都不会修改配置中的目标 URL。
 */
export function getRedirectUrl(request: Request): string | null {
  const requestUrl = new URL(request.url);
  const target = getTarget(requestUrl.hostname);

  return target?.toString() ?? null;
}
