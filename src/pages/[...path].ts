import type { APIRoute } from 'astro';
import { REDIRECT_STATUS } from '../config/redirects';
import { getRedirectUrl } from '../lib/redirect';

const handleRequest: APIRoute = ({ request }) => {
  try {
    const location = getRedirectUrl(request);

    if (!location) {
      return new Response('No redirect configured for this domain.\n', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    return new Response(null, {
      status: REDIRECT_STATUS,
      headers: {
        location,
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    console.error(error);
    return new Response('Redirect configuration error.\n', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
};

export const ALL = handleRequest;
