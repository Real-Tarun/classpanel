/**
 * Cloudflare Pages Function: /api/indexnow
 * Server-side IndexNow notification endpoint for ClassPanel.
 * Securely submits URLs to search engines (Bing, Yandex, etc.) without exposing
 * credentials in client-side bundles.
 */

const INDEXNOW_KEY = '0dd71d677b154e2cb4db14927a5a4f4d';
const INDEXNOW_HOST = 'classpanel.online';
const INDEXNOW_KEY_LOCATION = 'https://classpanel.online/0dd71d677b154e2cb4db14927a5a4f4d.txt';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

/**
 * Normalizes and validates URLs to ensure:
 * - HTTPS only
 * - Canonical classpanel.online domain
 * - Clean paths without fragments or tracking queries
 * - No internal, API, or 404 paths
 */
function normalizeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl, `https://${INDEXNOW_HOST}`);

    // Must belong to classpanel.online or www.classpanel.online
    const host = parsed.hostname.toLowerCase();
    if (host !== INDEXNOW_HOST && host !== `www.${INDEXNOW_HOST}`) {
      return null;
    }

    // Force https and canonical hostname
    parsed.protocol = 'https:';
    parsed.hostname = INDEXNOW_HOST;
    parsed.hash = '';

    // Strip common tracking parameters (utm_*, ref, etc.)
    const paramsToDelete = [];
    for (const key of parsed.searchParams.keys()) {
      if (key.startsWith('utm_') || key === 'ref' || key === 'fbclid' || key === 'gclid') {
        paramsToDelete.push(key);
      }
    }
    paramsToDelete.forEach(p => parsed.searchParams.delete(p));

    let pathname = parsed.pathname;

    // Reject non-indexable files & private endpoints
    const lowerPath = pathname.toLowerCase();
    if (
      lowerPath.startsWith('/api/') ||
      lowerPath.startsWith('/functions/') ||
      lowerPath.startsWith('/cdn-cgi/') ||
      lowerPath === '/404.html' ||
      lowerPath === '/404' ||
      lowerPath === '/_headers' ||
      lowerPath === '/_redirects' ||
      lowerPath === '/package.json'
    ) {
      return null;
    }

    // Normalize /index.html -> /
    if (pathname === '/index.html' || pathname === '/index.php') {
      pathname = '/';
    } else if (pathname.endsWith('/index.html')) {
      pathname = pathname.slice(0, -'index.html'.length);
    }

    // Ensure trailing slash for directory style paths unless it has a file extension
    const hasExtension = /\.[a-z0-9]+$/i.test(pathname);
    if (!hasExtension && !pathname.endsWith('/')) {
      pathname += '/';
    }

    parsed.pathname = pathname;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Executes the IndexNow POST request to the official API.
 */
async function submitToIndexNow(urls) {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  if (uniqueUrls.length === 0) {
    return { status: 400, message: 'No valid URLs provided to submit.' };
  }

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: uniqueUrls
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text().catch(() => '');

    return {
      status: response.status,
      ok: response.ok || response.status === 200 || response.status === 202,
      count: uniqueUrls.length,
      urls: uniqueUrls,
      responseMessage: responseText || `HTTP ${response.status}`
    };
  } catch (error) {
    console.error('IndexNow serverless submission error:', error);
    return {
      status: 502,
      ok: false,
      error: error.message || 'Failed to connect to IndexNow API'
    };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Optional authorization check if INDEXNOW_SECRET is configured
  const authHeader = request.headers.get('x-indexnow-secret') || request.headers.get('authorization');
  const configuredSecret = env?.INDEXNOW_SECRET;
  if (configuredSecret && authHeader !== configuredSecret && authHeader !== `Bearer ${configuredSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const rawList = Array.isArray(body.urls)
    ? body.urls
    : body.url
      ? [body.url]
      : [];

  if (rawList.length === 0) {
    return new Response(JSON.stringify({ error: 'Please supply a "urls" array or "url" string.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const validUrls = rawList
    .map(normalizeUrl)
    .filter(Boolean);

  if (validUrls.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid https://classpanel.online URLs found in request.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await submitToIndexNow(validUrls);

  return new Response(JSON.stringify(result, null, 2), {
    status: result.ok ? 200 : (result.status || 500),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({
      service: 'ClassPanel IndexNow Submission API',
      status: 'active',
      keyLocation: INDEXNOW_KEY_LOCATION,
      usage: 'Send POST with { "urls": ["https://classpanel.online/..."] }'
    }, null, 2), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // Handle single URL submission via GET query
  const normalized = normalizeUrl(targetUrl);
  if (!normalized) {
    return new Response(JSON.stringify({ error: 'Invalid or unauthorized URL.' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const result = await submitToIndexNow([normalized]);
  return new Response(JSON.stringify(result, null, 2), {
    status: result.ok ? 200 : (result.status || 500),
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
