/**
 * ClassPanel Admin Authentication Guard
 * Supports Cloudflare Access (Zero Trust) headers & Secret Key fallback
 */

export function verifyAdmin(context) {
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

  // 2. Secret Key Authentication (Authorization: Bearer <key> or x-admin-key)
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const customHeaderToken = request.headers.get('x-admin-key') || '';
  const providedKey = bearerToken || customHeaderToken;

  // Expected admin key from environment, or default fallback
  const validKey = env.ADMIN_SECRET_KEY || 'cp_admin_2026';

  if (providedKey && providedKey === validKey) {
    return {
      authorized: true,
      user: 'admin-key-holder',
      authType: 'secret-key'
    };
  }

  // Unauthorized response
  return {
    authorized: false,
    response: new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Security clearance required. Provide Cloudflare Access login or valid Admin Secret Key.'
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
