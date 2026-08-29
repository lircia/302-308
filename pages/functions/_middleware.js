import { findRedirect, isAdminHost, text } from './_lib.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // URL 未配置或当前 Host 不是 URL 对应域名时，Pages 也执行同样的域名重定向逻辑。
  if (isAdminHost(request, env)) {
    if (url.pathname === '/' || url.pathname.startsWith('/api/admin/')) return next();
    return text('Not found.', 404);
  }

  try {
    const location = await findRedirect(url.hostname, env);
    if (!location) return text('No redirect configured for this domain.', 404);
    return new Response(null, {
      status: 302,
      headers: {
        location,
        'cache-control': 'no-store',
        'x-domain-redirect-pages': '302-308',
      },
    });
  } catch (error) {
    console.error(error);
    return text(error instanceof Error ? error.message : 'Redirect configuration error.', 500);
  }
}
