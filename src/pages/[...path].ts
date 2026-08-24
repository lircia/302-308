import type { APIRoute } from 'astro';
import { getEnv, text } from '../lib/cloudflare';
import { findRedirect } from '../lib/redirect';

const handleRequest: APIRoute = async ({ request }) => {
  try {
    const location = await findRedirect(new URL(request.url).hostname, getEnv());

    if (!location) {
      return text('No redirect configured for this domain.', 404);
    }

    return new Response(null, {
      status: 302,
      headers: {
        location,
        'cache-control': 'no-store',
        'x-domain-redirect-worker': '302-308',
      },
    });
  } catch (error) {
    console.error(error);
    return text(error instanceof Error ? error.message : 'Redirect configuration error.', 500);
  }
};

export const ALL = handleRequest;
