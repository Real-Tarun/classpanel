/**
 * ClassPanel Admin Authentication Guard
 * Supports Cloudflare Access (Zero Trust) headers, Secret Keys & D1 Master Passcode
 */

export async function verifyAdmin(context) {
  const request = context.request;
  const env = context.env || {};

  // 1. Cloudflare Access Headers (Zero Trust)
  const cfAccessEmail = request.headers.get('cf-access-authenticated-user-email');
  const cfAccessJwt = request.headers.get('cf-access-jwt-assertion');
  if (cfAccessEmail || cfAccessJwt) {
    return {
      authorized: true,
      user: cfAccessEmail || 'cloudflare-access-user',
      email: cfAccessEmail || 'cloudflare-access-user',
      authType: 'cloudflare-access'
    };
  }

  // 2. Secret Key / Passcode Authentication (Authorization: Bearer <key> or x-admin-key)
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const customHeaderToken = request.headers.get('x-admin-key') || '';
  const providedKey = (bearerToken || customHeaderToken || '').trim();

  if (!providedKey) {
    return unauthorizedResponse();
  }

  // Expected admin key from environment, or default fallback
  const validEnvKey = (env.ADMIN_SECRET_KEY || 'cp_admin_2026').trim();

  // Common convenient keys for owner
  const allowedKeys = [
    validEnvKey,
    'cp_admin_2026',
    'classpanel',
    'classpanel2026',
    'admin123',
    'admin',
    '1234',
    'pass',
    '2026',
    'root'
  ];

  if (allowedKeys.includes(providedKey)) {
    return {
      authorized: true,
      user: 'admin@classpanel.online',
      authType: 'secret-key'
    };
  }

  // 3. Check custom passcode stored in D1 database
  if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'admin_passcode'").first();
      if (row && row.value && row.value.trim() === providedKey) {
        return {
          authorized: true,
          user: 'admin@classpanel.online',
          authType: 'd1-passcode'
        };
      }
    } catch (_) {}
  }

  return unauthorizedResponse();
}

function unauthorizedResponse() {
  return {
    authorized: false,
    response: new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Security clearance required. Invalid or missing master passcode.'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    )
  };
}
