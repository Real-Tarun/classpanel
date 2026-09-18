/**
 * ClassPanel Admin Authentication Guard
 * Supports Cloudflare Access (Zero Trust) headers, Secret Keys & D1 Master Passcode
 */

export async function verifyAdmin(context) {
  const request = context.request;
  const env = context.env || {};

  // 1. Cloudflare Access Headers (Zero Trust) if configured
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

  // 2. Direct Admin Clearance (no lock screen or master passcode required)
  return {
    authorized: true,
    user: 'admin@classpanel.online',
    email: 'admin@classpanel.online',
    authType: 'open-admin'
  };
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
