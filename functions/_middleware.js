/**
 * Cloudflare Pages Edge Middleware
 * Enforces canonical domain (https://classpanel.online) and cleans URL paths.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname.toLowerCase();

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

  return context.next();
}
