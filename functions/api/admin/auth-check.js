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
        return jsonRes({ authorized: false, error: 'Passcode is required' }, 400);
      }

      const masterPasscode = await getMasterPasscode(env);

      if (!masterPasscode) {
        // No passcode set yet — first-time setup
        return jsonRes({
          authorized: false,
          error: 'No admin passcode configured. Set ADMIN_PASSCODE in Cloudflare environment variables or via D1.',
          setup_required: true
        }, 401);
      }

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
            // 8 hours — matches token expiry
            'Set-Cookie': `cp_admin_token=${encodeURIComponent(token)}; Path=/; Max-Age=28800; SameSite=Strict; Secure`
          }
        });
      }

      // Wrong passcode — small delay to slow brute force
      await new Promise(r => setTimeout(r, 400));
      return jsonRes({ authorized: false, error: 'Incorrect passcode. Access denied.' }, 401);

    } catch (err) {
      return jsonRes({ authorized: false, error: err.message }, 500);
    }
  }

  function jsonRes(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
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
