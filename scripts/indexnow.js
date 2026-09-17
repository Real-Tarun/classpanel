#!/usr/bin/env node

/**
 * ClassPanel IndexNow Automated Submission Script
 * Reads sitemap.xml or CLI arguments, normalizes URLs, and submits to IndexNow API.
 * Tracks submission history in .indexnow-history.json to avoid unnecessary repeats.
 */

const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = '0dd71d677b154e2cb4db14927a5a4f4d';
const INDEXNOW_HOST = 'classpanel.online';
const INDEXNOW_KEY_LOCATION = 'https://classpanel.online/0dd71d677b154e2cb4db14927a5a4f4d.txt';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

const ROOT_DIR = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT_DIR, 'sitemap.xml');
const HISTORY_FILE = path.join(ROOT_DIR, '.indexnow-history.json');

/**
 * Normalizes a URL:
 * - HTTPS only
 * - Canonical classpanel.online domain
 * - Strip fragments and tracking queries
 * - Ignore internal / 404 paths
 */
function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const trimmed = rawUrl.trim();
    const parsed = new URL(trimmed, `https://${INDEXNOW_HOST}`);

    const host = parsed.hostname.toLowerCase();
    if (host !== INDEXNOW_HOST && host !== `www.${INDEXNOW_HOST}`) {
      return null;
    }

    parsed.protocol = 'https:';
    parsed.hostname = INDEXNOW_HOST;
    parsed.hash = '';

    // Strip common tracking parameters
    const toDelete = [];
    for (const k of parsed.searchParams.keys()) {
      if (k.startsWith('utm_') || k === 'ref' || k === 'fbclid' || k === 'gclid') {
        toDelete.push(k);
      }
    }
    toDelete.forEach(k => parsed.searchParams.delete(k));

    let pathname = parsed.pathname;
    const lower = pathname.toLowerCase();
    if (
      lower.startsWith('/api/') ||
      lower.startsWith('/functions/') ||
      lower.startsWith('/cdn-cgi/') ||
      lower === '/404.html' ||
      lower === '/404' ||
      lower === '/_headers' ||
      lower === '/_redirects' ||
      lower === '/package.json'
    ) {
      return null;
    }

    if (pathname === '/index.html' || pathname === '/index.php') {
      pathname = '/';
    } else if (pathname.endsWith('/index.html')) {
      pathname = pathname.slice(0, -'index.html'.length);
    }

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
 * Extracts all URLs from sitemap.xml
 */
function getUrlsFromSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.warn('⚠️  sitemap.xml not found at', SITEMAP_PATH);
    return [];
  }

  const content = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const matches = content.match(/<loc>\s*(https?:\/\/[^\s<]+)\s*<\/loc>/gi) || [];

  const urls = [];
  for (const match of matches) {
    const raw = match.replace(/<\/?loc>/gi, '').trim();
    const normalized = normalizeUrl(raw);
    if (normalized && !urls.includes(normalized)) {
      urls.push(normalized);
    }
  }

  return urls;
}

/**
 * Loads previously submitted URLs from local history cache
 */
function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
      return data && typeof data === 'object' ? data : { submissions: {} };
    } catch {
      return { submissions: {} };
    }
  }
  return { submissions: {} };
}

/**
 * Saves submission history
 */
function saveHistory(history, submittedUrls) {
  const now = new Date().toISOString();
  if (!history.submissions) history.submissions = {};

  submittedUrls.forEach(url => {
    history.submissions[url] = {
      lastSubmitted: now
    };
  });

  history.lastRun = now;

  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.warn('⚠️  Failed to save submission history:', err.message);
  }
}

/**
 * Performs HTTP POST to IndexNow API
 */
async function submitToIndexNow(urls) {
  if (urls.length === 0) {
    console.log('ℹ️  No new or modified URLs to submit.');
    return { success: true, count: 0 };
  }

  const payload = {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls
  };

  console.log(`📡 Submitting ${urls.length} URL(s) to IndexNow (${INDEXNOW_ENDPOINT})...`);

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text().catch(() => '');

    if (res.status === 200 || res.status === 202) {
      console.log(`✅ IndexNow Submission Successful (HTTP ${res.status}):`);
      console.log(`   Submitted ${urls.length} URL(s) under host: ${INDEXNOW_HOST}`);
      urls.forEach(u => console.log(`   - ${u}`));
      return { success: true, status: res.status, count: urls.length };
    } else if (res.status === 400) {
      console.error(`❌ IndexNow Error (HTTP 400 - Invalid format):`, text);
      return { success: false, status: 400, message: text };
    } else if (res.status === 403) {
      console.error(`❌ IndexNow Error (HTTP 403 - Key not valid or keyLocation unreachable):`, text);
      return { success: false, status: 403, message: text };
    } else if (res.status === 422) {
      console.error(`❌ IndexNow Error (HTTP 422 - Invalid URLs or key mismatch):`, text);
      return { success: false, status: 422, message: text };
    } else if (res.status === 429) {
      console.warn(`⚠️  IndexNow Rate Limited (HTTP 429): Please wait before submitting again.`);
      return { success: false, status: 429, message: text };
    } else {
      console.warn(`⚠️  IndexNow Response (HTTP ${res.status}):`, text);
      return { success: res.ok, status: res.status, message: text };
    }
  } catch (err) {
    console.error(`❌ Network error while connecting to IndexNow:`, err.message);
    return { success: false, error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--all') || args.includes('-a');
  const explicitUrls = args.filter(a => !a.startsWith('-'));

  let urlsToSubmit = [];
  const history = loadHistory();

  if (explicitUrls.length > 0) {
    // Explicit URLs passed on CLI
    urlsToSubmit = explicitUrls
      .map(normalizeUrl)
      .filter(Boolean);
  } else {
    // Read from sitemap.xml
    const allSitemapUrls = getUrlsFromSitemap();

    if (forceAll || Object.keys(history.submissions || {}).length === 0) {
      urlsToSubmit = allSitemapUrls;
      console.log(`📋 Found ${allSitemapUrls.length} total indexable URLs in sitemap.xml.`);
    } else {
      // Only submit URLs that haven't been submitted yet or are newly added
      urlsToSubmit = allSitemapUrls.filter(url => !history.submissions[url]);
      console.log(`📋 Found ${allSitemapUrls.length} total URLs in sitemap; ${urlsToSubmit.length} are new/unsubmitted.`);
    }
  }

  // Deduplicate
  urlsToSubmit = Array.from(new Set(urlsToSubmit));

  if (urlsToSubmit.length === 0) {
    console.log('✅ All sitemap URLs are already submitted. (Use --all to force re-submission).');
    process.exit(0);
  }

  const result = await submitToIndexNow(urlsToSubmit);

  if (result.success) {
    saveHistory(history, urlsToSubmit);
    console.log('🎉 IndexNow process finished successfully.');
  } else {
    console.warn('⚠️  IndexNow process encountered an issue, but local state was preserved.');
  }
}

main().catch(err => {
  console.error('Unexpected error in IndexNow runner:', err);
  process.exit(0); // Graceful exit so build pipelines never fail
});
