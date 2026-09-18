/**
 * ClassPanel Admin Authentication Guard
 * Supports Cloudflare Access (Zero Trust), HMAC-signed Session Tokens, & D1 Master Passcode
 */

const DEFAULT_PASSCODE = 'cp_admin_2026';
const SECRET_SALT = 'cp_admin_master_salt_2026_classpanel';

/**
 * Fetch current admin passcode from Cloudflare D1 site_settings table or env fallback
 */
export async function getMasterPasscode(env) {
  if (env && env.ADMIN_PASSCODE) {
    return String(env.ADMIN_PASSCODE).trim();
  }

  const db = env ? env.DB : null;
  if (db) {
    try {
      const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'admin_passcode'").first();
      if (row && row.value && row.value.trim().length >= 4) {
        return row.value.trim();
      }
    } catch (_) {}
  }

  return DEFAULT_PASSCODE;
}

/**
 * Generate a cryptographically signed session token (Valid for 30 days)
 */
export async function generateSessionToken(passcode) {
  const timestamp = Date.now();
  const data = `${timestamp}:${passcode}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET_SALT),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `cps_${timestamp}_${sigHex}`;
}

/**
 * Verify a signed session token
 */
export async function validateSessionToken(token, passcode) {
  if (!token || typeof token !== 'string') return false;

  // Direct passcode match
  if (token === passcode) return true;

  if (!token.startsWith('cps_')) return false;
  const parts = token.split('_');
  if (parts.length !== 3) return false;

  const timestamp = parseInt(parts[1], 10);
  const sigHex = parts[2];

  // Token expires after 30 days
  if (isNaN(timestamp) || Date.now() - timestamp > 30 * 24 * 60 * 60 * 1000) {
    return false;
  }

  try {
    const data = `${timestamp}:${passcode}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SECRET_SALT),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return sigHex === expectedHex;
  } catch (_) {
    return false;
  }
}

/**
 * Verify admin clearance for any /api/admin/* request
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

  // 2. Extract Authorization Bearer token or header
  let token = null;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (request.headers.get('x-admin-token')) {
    token = request.headers.get('x-admin-token').trim();
  } else {
    // Check Cookie if present
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/cp_admin_token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]).trim();
  }

  if (token) {
    const masterPasscode = await getMasterPasscode(env);
    const isValid = await validateSessionToken(token, masterPasscode);
    if (isValid) {
      return {
        authorized: true,
        user: 'admin@classpanel.online',
        email: 'admin@classpanel.online',
        authType: 'session-token'
      };
    }
  }

  // 3. Unauthorized
  return unauthorizedResponse();
}

export function unauthorizedResponse() {
  return {
    authorized: false,
    response: new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Security clearance required. Please unlock with your admin master passcode.'
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
