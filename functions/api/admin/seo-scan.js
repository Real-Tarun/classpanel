/**
 * ClassPanel Admin API - Real-time SEO Health Scanner
 * On-demand crawler & analyzer checking meta descriptions, canonicals, H1s, and social tags
 */

import { verifyAdmin } from './_auth.js';

const SITE_PAGES = [
  { url: '/', title: 'Homepage', type: 'core' },
  { url: '/tools/', title: 'All Tools Hub', type: 'core' },
  { url: '/blog/', title: 'Blog Index', type: 'core' },
  { url: '/about/', title: 'About ClassPanel', type: 'core' },
  { url: '/privacy/', title: 'Privacy Policy', type: 'core' },
  { url: '/contact/', title: 'Contact & Feedback', type: 'core' },
  // Tools
  { url: '/tools/classroom-timer/', title: 'Classroom Timer', type: 'tool' },
  { url: '/tools/random-name-picker/', title: 'Random Name Picker', type: 'tool' },
  { url: '/tools/group-generator/', title: 'Group Generator', type: 'tool' },
  { url: '/tools/exam-timer/', title: 'Official Exam Timer', type: 'tool' },
  { url: '/tools/sensory-timer/', title: 'Sensory & Meditation Timer', type: 'tool' },
  { url: '/tools/stopwatch/', title: 'Stopwatch', type: 'tool' },
  { url: '/tools/dice-roller/', title: 'Dice Roller', type: 'tool' },
  { url: '/tools/coin-flip/', title: 'Coin Flip', type: 'tool' },
  { url: '/tools/presentation-timer/', title: 'Presentation Timer', type: 'tool' },
  { url: '/tools/random-number-generator/', title: 'Random Number Generator', type: 'tool' },
  { url: '/tools/tally-counter/', title: 'Tally Counter', type: 'tool' },
  { url: '/tools/clocks/', title: 'Classroom Clocks', type: 'tool' },
  { url: '/tools/rock-paper-scissors/', title: 'Rock Paper Scissors', type: 'tool' },
  { url: '/tools/race-timers/', title: 'Race Timers', type: 'tool' },
  { url: '/tools/color-picker/', title: 'Color Picker', type: 'tool' },
  { url: '/tools/holiday-timers/', title: 'Holiday Timers', type: 'tool' },
  { url: '/tools/chance-games/', title: 'Chance Games Suite', type: 'tool' },
  // Blog Sample
  { url: '/blog/10-classroom-timer-tricks-to-keep-students-on-task/', title: '10 Classroom Timer Tricks', type: 'blog' },
  { url: '/blog/best-free-online-timer-for-studying-pomodoro/', title: 'Best Free Online Study Timer', type: 'blog' },
  { url: '/blog/how-to-split-class-into-balanced-groups-fairly/', title: 'Split Class into Balanced Groups', type: 'blog' }
];

export async function onRequest(context) {
  const auth = verifyAdmin(context);
  if (!auth.authorized) return auth.response;

  const { request } = context;
  const baseUrl = new URL(request.url).origin;

  try {
    const auditResults = [];
    let totalChecks = 0;
    let passedChecks = 0;

    // Scan pages concurrently in batches
    const scanPromises = SITE_PAGES.map(async (page) => {
      const pageResult = {
        path: page.url,
        title: page.title,
        type: page.type,
        status: 'pass',
        checks: [],
        issues: []
      };

      try {
        const fetchUrl = `${baseUrl}${page.url}`;
        const resp = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'ClassPanel-SEOBot/1.0' }
        });

        if (!resp.ok) {
          pageResult.status = 'fail';
          pageResult.issues.push(`HTTP ${resp.status} status`);
          return pageResult;
        }

        const html = await resp.text();

        // 1. Title check
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const titleText = titleMatch ? titleMatch[1].trim() : '';
        totalChecks++;
        if (titleText.length >= 20 && titleText.length <= 70) {
          passedChecks++;
          pageResult.checks.push({ name: 'Title Tag', pass: true, detail: `${titleText.length} chars` });
        } else if (titleText.length > 0) {
          passedChecks++;
          pageResult.checks.push({ name: 'Title Tag', pass: true, detail: `${titleText.length} chars (advisory)` });
        } else {
          pageResult.status = 'fail';
          pageResult.checks.push({ name: 'Title Tag', pass: false, detail: 'Missing <title>' });
          pageResult.issues.push('Missing <title> tag');
        }

        // 2. Meta description check
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        const descText = descMatch ? descMatch[1].trim() : '';
        totalChecks++;
        if (descText.length >= 70 && descText.length <= 180) {
          passedChecks++;
          pageResult.checks.push({ name: 'Meta Description', pass: true, detail: `${descText.length} chars` });
        } else if (descText.length > 0) {
          passedChecks++;
          pageResult.checks.push({ name: 'Meta Description', pass: true, detail: `${descText.length} chars` });
        } else {
          pageResult.status = 'fail';
          pageResult.checks.push({ name: 'Meta Description', pass: false, detail: 'Missing description' });
          pageResult.issues.push('Missing meta description');
        }

        // 3. Canonical Tag
        const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
        totalChecks++;
        if (canonicalMatch && canonicalMatch[1].startsWith('https://classpanel.online/')) {
          passedChecks++;
          pageResult.checks.push({ name: 'Canonical Tag', pass: true, detail: canonicalMatch[1] });
        } else {
          pageResult.status = 'fail';
          pageResult.checks.push({ name: 'Canonical Tag', pass: false, detail: 'Missing or non-canonical' });
          pageResult.issues.push('Missing canonical tag');
        }

        // 4. Single H1 rule
        const h1Matches = html.match(/<h1\b[^>]*>/gi) || [];
        totalChecks++;
        if (h1Matches.length === 1) {
          passedChecks++;
          pageResult.checks.push({ name: 'H1 Structure', pass: true, detail: 'Exactly 1 H1' });
        } else if (h1Matches.length === 0) {
          pageResult.status = 'warn';
          pageResult.checks.push({ name: 'H1 Structure', pass: false, detail: 'Zero H1 tags' });
          pageResult.issues.push('Missing <h1> heading');
        } else {
          pageResult.status = 'warn';
          pageResult.checks.push({ name: 'H1 Structure', pass: false, detail: `${h1Matches.length} H1 tags` });
          pageResult.issues.push('Multiple <h1> headings found');
        }

        // 5. Social OpenGraph check
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']/i);
        const ogImgMatch = html.match(/<meta\s+property=["']og:image["']/i);
        totalChecks++;
        if (ogTitleMatch && ogImgMatch) {
          passedChecks++;
          pageResult.checks.push({ name: 'Open Graph Cards', pass: true, detail: 'Complete' });
        } else {
          pageResult.status = 'warn';
          pageResult.checks.push({ name: 'Open Graph Cards', pass: false, detail: 'Missing og:image or og:title' });
        }

        return pageResult;
      } catch (err) {
        pageResult.status = 'fail';
        pageResult.issues.push(`Scan fetch error: ${err.message}`);
        return pageResult;
      }
    });

    const results = await Promise.all(scanPromises);
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    return jsonResponse({
      timestamp: new Date().toISOString(),
      score,
      totalPages: results.length,
      passedPages: results.filter(r => r.status === 'pass').length,
      warningPages: results.filter(r => r.status === 'warn').length,
      failedPages: results.filter(r => r.status === 'fail').length,
      pages: results
    });
  } catch (err) {
    return jsonResponse({ error: 'SEO Scan failed', message: err.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
