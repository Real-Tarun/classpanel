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

# Google AdSense Crawlers
User-agent: Mediapartners-Google
Allow: /

User-agent: Google-adstxt
Allow: /

# Googlebot & Google Search Console Inspection Tools
User-agent: Googlebot
Allow: /

User-agent: Google-InspectionTool
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Googlebot-Image
Allow: /
Allow: /favicon.ico
Allow: /assets/

# Microsoft Bing
User-agent: Bingbot
Allow: /

User-agent: msnbot
Allow: /

# Yandex Search
User-agent: YandexBot
Allow: /

User-agent: Yandex
Allow: /

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

# Canonical Sitemap & Host
Host: https://classpanel.online
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

  // 6. Normalize /admin to /admin/
  if (url.pathname === '/admin') {
    url.pathname = '/admin/';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
