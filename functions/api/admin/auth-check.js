/**
 * ClassPanel Admin API - Auth Check Endpoint
 * Validates session credentials via Cloudflare Access or Admin Passcode
 */

import { verifyAdmin } from './_auth.js';

export async function onRequest(context) {
  const auth = verifyAdmin(context);
  if (!auth.authorized) {
    return auth.response;
  }

  return new Response(JSON.stringify({
    authorized: true,
    user: auth.user,
    authType: auth.authType
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
