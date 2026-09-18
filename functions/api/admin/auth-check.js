/**
 * ClassPanel Admin API - Auth Check & Unlock Endpoint
 * Validates session credentials or checks entered master passcode
 */

import { verifyAdmin, getMasterPasscode, generateSessionToken } from './_auth.js';

export async function onRequest(context) {
  const { request, env } = context;

  // Handle POST: Unlock with passcode
  if (request.method === 'POST') {
    try {
      const body = await request.json().catch(() => ({}));
      const passcode = body.passcode ? String(body.passcode).trim() : '';

      if (!passcode) {
        return new Response(JSON.stringify({ authorized: false, error: 'Passcode is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }

      const masterPasscode = await getMasterPasscode(env);

      if (passcode === masterPasscode) {
        const token = await generateSessionToken(masterPasscode);
        return new Response(JSON.stringify({
          authorized: true,
          token,
          user: 'admin@classpanel.online',
          authType: 'passcode-unlock',
          message: 'Security clearance granted'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'Set-Cookie': `cp_admin_token=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; SameSite=Strict; Secure`
          }
        });
      }

      // Invalid passcode
      return new Response(JSON.stringify({
        authorized: false,
        error: 'Invalid master passcode. Access denied.'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ authorized: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
      });
    }
  }

  // Handle GET / OPTIONS: Validate existing session token
  const auth = await verifyAdmin(context);
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
