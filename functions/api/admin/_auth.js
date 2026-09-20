/**
 * ClassPanel Admin Authentication Guard
 * SECURITY: Token is bound to current passcode — changing password invalidates all old sessions.
 */

const BASE_SALT = 'cp_classpanel_admin_2026_base';

/**
 * Fetch current admin passcode from D1 or env
 */
export async function getMasterPasscode(env) {
  const db = env ? env.DB : null;
  if (db) {
    try {
      const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'admin_passcode'").first();
      if (row && row.value && row.value.trim().length >= 6) {
        return row.value.trim();
      }
    } catch (_) {}
  }
  if (env && env.ADMIN_PASSCODE) {
    return String(env.ADMIN_PASSCODE).trim();
  }
  // Default initial passcode before first setup/change in Admin Settings
  return 'cp_admin_2026';
}

/**
 * SECURITY: Salt includes the current passcode.
 * When passcode changes, salt changes, all old HMAC tokens become invalid.
 */
function getEffectiveSalt(passcode) {
  return `${BASE_SALT}:${passcode}`;
}

/**
 * Generate a cryptographically signed session token (valid for 8 hours)
 */
export async function generateSessionToken(passcode) {
  const timestamp = Date.now();
  const data = `${timestamp}:${passcode}`;
  const salt = getEffectiveSalt(passcode);
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(salt),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `cps_${timestamp}_${sigHex}`;
}

/**
 * Verify a signed session token against current passcode
 * Token expires in 8 hours. Old tokens invalid after password change.
 */
export async function validateSessionToken(token, passcode) {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith('cps_')) return false;

  const parts = token.split('_');
  if (parts.length !== 3) return false;

  const timestamp = parseInt(parts[1], 10);
  const sigHex = parts[2];

  // Token expires after 8 hours
  if (isNaN(timestamp) || Date.now() - timestamp > 8 * 60 * 60 * 1000) {
    return false;
  }

  try {
    const data = `${timestamp}:${passcode}`;
    const salt = getEffectiveSalt(passcode);
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(salt),
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

  // 1. Cloudflare Access (Zero Trust)
  const cfAccessEmail = request.headers.get('cf-access-authenticated-user-email');
  if (cfAccessEmail) {
    return { authorized: true, user: cfAccessEmail, authType: 'cloudflare-access' };
  }

  // 2. Extract Bearer token
  let token = null;
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (request.headers.get('x-admin-token')) {
    token = request.headers.get('x-admin-token').trim();
  } else {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/cp_admin_token=([^;]+)/);
    if (match) token = decodeURIComponent(match[1]).trim();
  }

  if (token) {
    const masterPasscode = await getMasterPasscode(env);
    if (masterPasscode) {
      const isValid = await validateSessionToken(token, masterPasscode);
      if (isValid) {
        return { authorized: true, user: 'admin@classpanel.online', authType: 'session-token' };
      }
    }
  }

  return unauthorizedResponse();
}

export function unauthorizedResponse() {
  return {
    authorized: false,
    response: new Response(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired session. Please log in again.' }),
      { status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }
    )
  };
}
