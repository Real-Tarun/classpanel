/**
 * Cloudflare Pages Edge Middleware
 * Enforces canonical domain (https://classpanel.online) and cleans URL paths.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

  // Handle Yandex Webmaster verification directly with HTTP 200 (prevents 308 redirect)
  if (url.pathname === '/yandex_68d0900cb3d0d199.html' || url.pathname === '/yandex_68d0900cb3d0d199') {
    return new Response(
      `<html>\n    <head>\n        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n    </head>\n    <body>Verification: 68d0900cb3d0d199</body>\n</html>\n`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }

  // Handle llms.txt and .well-known/llms.txt directly with HTTP 200
  if (url.pathname === '/llms.txt' || url.pathname === '/.well-known/llms.txt') {
    const llmsContent = `# ClassPanel.online
> Free, instant, full-screen digital tools & countdown timers engineered for smartboards, classroom lessons, Pomodoro study blocks, and everyday decisions. No sign-up, zero tracking, works 100% offline.

Website: https://classpanel.online

## Core Features
- **Zero Sign-Up**: No account creation, passwords, or paywalls.
- **Offline PWA**: Fully functional offline via Service Worker.
- **Privacy First**: Zero personal student data collection (FERPA/COPPA compliant). All rosters are stored locally in the user's browser.
- **Smartboard & Projector Optimized**: Giant high-contrast typography and keyboard shortcuts.

## Interactive Tools Directory

- [Classroom & Study Timer](https://classpanel.online/tools/classroom-timer/): Giant countdown timer, Pomodoro intervals (25/5), and ambient focus audio (Calm, 10Hz Alpha Rain, 5D Journey, Zen Waves).
- [Wheel of Names & Picker](https://classpanel.online/tools/random-name-picker/): Spinning decision wheel for student rosters, raffle giveaways, and random selection with eliminate-on-pick.
- [Random Group Generator](https://classpanel.online/tools/group-generator/): Instant team creation and pod pairing with drag-and-drop roster management.
- [Official Exam Timer](https://classpanel.online/tools/exam-timer/): Standardized testing board with synchronized real-time wall clock and silent milestone warnings.
- [Sensory & Meditation Timer](https://classpanel.online/tools/sensory-timer/): Guided box breathing (4-4-4-4, 4-7-8, coherence), soothing visual animations, and 528Hz calming chimes.
- [Online Clocks & Display](https://classpanel.online/tools/clocks/): Fullscreen analog clock, 12/24-hour digital display, and classroom time quiz.
- [Random Number Generator](https://classpanel.online/tools/random-number-generator/): Min/max random number selector with history and duplicate exclusion.
- [Chance Games & Mystery Hub](https://classpanel.online/tools/chance-games/): Mystery treasure chest unlocks, lucky spin wheels, and cosmic Magic 8-Ball oracle.
- [Multi-Team Tally Counter](https://classpanel.online/tools/tally-counter/): Multi-track clicker for classroom points, sports scores, inventory, and attendance.
- [Toastmasters & Speech Timer](https://classpanel.online/tools/presentation-timer/): Automated traffic-light speech pacer (Green, Amber, Red) for debates and public speaking.
- [Race Timers & F1 Start Lights](https://classpanel.online/tools/race-timers/): Animated sprint countdowns and Formula 1 start gantry reaction reflex test.
- [Countdown to Any Date](https://classpanel.online/tools/holiday-timers/): Live day/hour/minute countdown ticker for holidays, exams, deadlines, and OBS live streaming.
- [Rock Paper Scissors](https://classpanel.online/tools/rock-paper-scissors/): Interactive play against computer with Best of 3/5/7 match modes and streak tracker.
- [Flip a Coin Simulator](https://classpanel.online/tools/coin-flip/): 3D metallic coin flipper with multi-coin flips (1 to 5+) and probability statistics.
- [Polyhedral Dice Roller](https://classpanel.online/tools/dice-roller/): RPG polyhedral dice (d4, d6, d8, d10, d12, d20, d100) with physics roll and running sum.
- [Color Picker & Palette Converter](https://classpanel.online/tools/color-picker/): HEX, RGB, HSL, CMYK code generator with WCAG contrast checker and curated palettes.
- [Online Stopwatch & Split Laps](https://classpanel.online/tools/stopwatch/): Millisecond stopwatch with split lap tracking and fastest/slowest lap analysis.
- [Online Metronome](https://classpanel.online/tools/metronome/): Visual and acoustic tempo metronome (20-300 BPM) with time signature accents and tap tempo.
- [Chess Clock & Timer](https://classpanel.online/tools/chess-timer/): Dual game clock with Blitz, Rapid, Bullet, and Fischer increment time controls.
- [Talking Clock](https://classpanel.online/tools/talking-clock/): Speech-synthesized voice announcements for current time, study intervals, and accessibility.
- [Bomb Countdown Timer](https://classpanel.online/tools/bomb-countdown/): Dramatic burning fuse animation with explosion sound effect for classroom quizzes and lightning rounds.
- [Custom Timer Maker](https://classpanel.online/tools/custom-timer/): Build personalized timers with custom labels, sound alarms, color schemes, and shareable URLs.
- [Split Lap Timer](https://classpanel.online/tools/split-timer/): Multi-athlete precision split timer for track, cross-country, and fitness assessments.

## Optional Full Context
- Detailed Documentation: https://classpanel.online/llms-full.txt
`;
    return new Response(llmsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // Handle Google AdSense ads.txt directly with HTTP 200 (fastest response, clean single headers)
  if (url.pathname === '/ads.txt') {
    return new Response(
      'google.com, pub-1563010132282807, DIRECT, f08c47fec0942fa0\n',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  // Serve clean robots.txt directly to prevent Cloudflare AI-block & Content-Signal injection
  if (url.pathname === '/robots.txt') {
    const robotsTxt = `# ==============================================================================
# ClassPanel.online — Free Online Productivity, Study & Classroom Digital Tools
# Canonical URL: https://classpanel.online/
# ==============================================================================

# Global Search Crawler Directives
User-agent: *
Allow: /
Allow: /tools/
Allow: /blog/
Allow: /about/
Allow: /privacy/
Allow: /contact/
Allow: /assets/
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /.well-known/
Disallow: /functions/
Disallow: /_redirects
Disallow: /_headers
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /.git/
Disallow: /cdn-cgi/
Disallow: /404.html
Disallow: /admin/
Disallow: /api/admin/
Disallow: /es/tools/
Disallow: /fr/tools/
Disallow: /de/tools/

# Google AdSense Crawlers
User-agent: Mediapartners-Google
Allow: /

User-agent: Google-adstxt
Allow: /

# Googlebot & Google Search Console Inspection Tools
User-agent: Googlebot
Allow: /
Disallow: /functions/
Disallow: /_redirects
Disallow: /_headers
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /.git/
Disallow: /cdn-cgi/
Disallow: /404.html
Disallow: /admin/
Disallow: /api/admin/
Disallow: /es/tools/
Disallow: /fr/tools/
Disallow: /de/tools/

User-agent: Google-InspectionTool
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Googlebot-Image
Allow: /
Allow: /favicon.ico
Allow: /favicon*
Allow: /assets/

# Googlebot Favicon Crawler (Search SERP Logos)
User-agent: Googlebot-Favicon
Allow: /
Allow: /favicon.ico
Allow: /favicon*
Allow: /assets/
Allow: /assets/icons/

# Microsoft Bing
User-agent: Bingbot
Allow: /
Disallow: /functions/
Disallow: /_redirects
Disallow: /_headers
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /.git/
Disallow: /cdn-cgi/
Disallow: /404.html
Disallow: /admin/
Disallow: /api/admin/
Disallow: /es/tools/
Disallow: /fr/tools/
Disallow: /de/tools/

User-agent: msnbot
Allow: /

# Yandex Search
User-agent: YandexBot
Allow: /
Disallow: /functions/
Disallow: /_redirects
Disallow: /_headers
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /.git/
Disallow: /cdn-cgi/
Disallow: /404.html
Disallow: /admin/
Disallow: /api/admin/
Disallow: /es/tools/
Disallow: /fr/tools/
Disallow: /de/tools/

User-agent: Yandex
Allow: /
Disallow: /functions/
Disallow: /_redirects
Disallow: /_headers
Disallow: /package.json
Disallow: /package-lock.json
Disallow: /.git/
Disallow: /cdn-cgi/
Disallow: /404.html
Disallow: /admin/
Disallow: /api/admin/
Disallow: /es/tools/
Disallow: /fr/tools/
Disallow: /de/tools/

# Apple Search & Siri Suggestions
User-agent: Applebot
Allow: /

# DuckDuckGo
User-agent: DuckDuckBot
Allow: /

# Social Media Link Preview Crawlers
User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: Discordbot
Allow: /

# AI Search Engines, Answer Engines & AI Training Crawlers (Fully Allowed)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: FacebookBot
Allow: /

User-agent: Bytespider
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Diffbot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: YouBot
Allow: /

User-agent: img2dataset
Allow: /

# Site Audit & SEO Crawlers (Paced crawl to prevent edge rate-limiting)
User-agent: SemrushBot
User-agent: SemrushBot-SA
User-agent: SemrushBot-BA
User-agent: SemrushBot-SI
User-agent: SemrushBot-SBM
Allow: /
Crawl-delay: 1

User-agent: AhrefsBot
User-agent: AhrefsSiteAudit
Allow: /
Crawl-delay: 1

# Canonical Sitemap & Host
Host: classpanel.online
Sitemap: https://classpanel.online/sitemap.xml
`;
    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate, no-cache'
      }
    });
  }

  // 1. Force www.classpanel.online -> https://classpanel.online
  if (hostname === 'www.classpanel.online') {
    url.hostname = 'classpanel.online';
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  // 2. Force HTTP -> HTTPS for classpanel.online
  const proto = context.request.headers.get('x-forwarded-proto');
  if (proto === 'http' && hostname === 'classpanel.online') {
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  // 3. Normalize /index.html and /index.php to /
  if (url.pathname === '/index.html' || url.pathname === '/index.php') {
    url.pathname = '/';
    return Response.redirect(url.toString(), 301);
  }

  // 4. Normalize /tools/xyz/index.html to /tools/xyz/
  if (url.pathname.endsWith('/index.html')) {
    url.pathname = url.pathname.slice(0, -'index.html'.length);
    return Response.redirect(url.toString(), 301);
  }

  // 5. Normalize /tools to /tools/
  if (url.pathname === '/tools') {
    url.pathname = '/tools/';
    return Response.redirect(url.toString(), 301);
  }

  // 7. Edge Enforcement: Block restricted IPs and devices
  const clientIp = context.request.headers.get('cf-connecting-ip');
  const acceptHeader = context.request.headers.get('accept') || '';
  const cookieHeader = context.request.headers.get('cookie') || '';
  const didMatch = cookieHeader.match(/cp_did=([a-zA-Z0-9_\-]+)/);
  const deviceId = didMatch ? didMatch[1] : null;

  if (
    context.env?.DB &&
    (clientIp || deviceId) &&
    !url.pathname.startsWith('/admin') &&
    !url.pathname.startsWith('/api/admin') &&
    (acceptHeader.includes('text/html') || url.pathname.startsWith('/api/'))
  ) {
    try {
      let isBlocked = null;
      if (clientIp && deviceId) {
        isBlocked = await context.env.DB.prepare(
          'SELECT id FROM blocked_visitors WHERE ip = ? OR (device_id IS NOT NULL AND device_id = ?) LIMIT 1'
        ).bind(clientIp, deviceId).first();
      } else if (clientIp) {
        isBlocked = await context.env.DB.prepare(
          'SELECT id FROM blocked_visitors WHERE ip = ? LIMIT 1'
        ).bind(clientIp).first();
      } else if (deviceId) {
        isBlocked = await context.env.DB.prepare(
          'SELECT id FROM blocked_visitors WHERE device_id = ? LIMIT 1'
        ).bind(deviceId).first();
      }

      if (isBlocked) {
        return new Response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>403 Forbidden - Access Restricted</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #070d1e; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 1.5rem; box-sizing: border-box; text-align: center; }
    .box { background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 16px; padding: 2.5rem 2rem; max-width: 480px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
    h1 { color: #ef4444; font-size: 2rem; margin: 0 0 1rem; font-weight: 800; }
    p { color: #94a3b8; line-height: 1.6; margin: 0; font-size: 1.05rem; }
  </style>
</head>
<body>
  <div class="box">
    <h1>🚫 403 Forbidden</h1>
    <p>Your access to ClassPanel has been permanently restricted due to abuse, spamming, or violation of site policies.</p>
  </div>
</body>
</html>`,
          {
            status: 403,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store'
            }
          }
        );
      }
    } catch (_) {
      // Fail-open
    }
  }

  return context.next();
}
