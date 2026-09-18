/**
 * ClassPanel Dynamic Blog Post Edge Renderer
 * Reads published blog posts directly from Cloudflare D1 with automatic static fallback
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;
  const db = env.DB;

  if (!db || !slug) {
    return context.next();
  }

  try {
    const post = await db.prepare(`
      SELECT * FROM posts 
      WHERE slug = ? AND (status = 'published' OR (status = 'scheduled' AND publish_date <= datetime('now')))
    `).bind(slug).first();

    if (!post) {
      // Fallback to static pre-rendered file if available
      return context.next();
    }

    // Convert simple Markdown to HTML for dynamic posts
    const bodyHtml = markdownToHtml(post.content);
    const relatedTools = post.related_tools ? JSON.parse(post.related_tools) : [];

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — ClassPanel</title>
  <meta name="description" content="${escapeHtml(post.description || '')}">
  <link rel="canonical" href="https://classpanel.online/blog/${escapeHtml(post.slug)}/">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" type="image/svg+xml" href="/assets/icons/icon.svg">
  <link rel="stylesheet" href="/assets/css/main.css?v=21">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="ClassPanel">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.description || '')}">
  <meta property="og:url" content="https://classpanel.online/blog/${escapeHtml(post.slug)}/">
  <meta property="og:image" content="${escapeHtml(post.cover_image || '/assets/images/og-card.png')}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.description || '')}">
  <meta name="twitter:image" content="${escapeHtml(post.cover_image || '/assets/images/og-card.png')}">

  <!-- Clarity tracking code for https://classpanel.online/ -->
  <script>
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "yk2i9d47t3");
  </script>
</head>
<body>

  <!-- Site Header -->
  <header class="site-header">
    <div class="container header-inner">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="/" class="brand-logo" title="Back to ClassPanel Home">
          <img src="/assets/icons/logo.png" alt="ClassPanel Logo" class="brand-icon">
          <span>Class<span style="color: var(--primary);">Panel</span></span>
        </a>
        <span style="color: var(--border-strong); font-size: 1.25rem;">/</span>
        <a href="/blog/" style="font-weight: 700; color: var(--text-muted); text-decoration: none;">Blog</a>
      </div>

      <div class="header-actions">
        <button class="action-btn action-btn-icon" data-action="toggle-sound" title="Toggle Sound">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
        <button class="action-btn action-btn-icon" data-action="toggle-theme" title="Toggle Theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Article Content -->
  <main class="container" style="max-width: 820px; padding: 3rem 1rem 5rem;">
    <article class="blog-article">
      <div style="margin-bottom: 2rem;">
        <div style="display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 0.75rem;">
          <span>ClassPanel Editorial</span>
          <span>•</span>
          <span>${escapeHtml(post.publish_date ? post.publish_date.split('T')[0] : '')}</span>
        </div>
        <h1 style="font-size: clamp(2rem, 5vw, 2.75rem); font-weight: 900; line-height: 1.2; color: var(--text-primary); margin-bottom: 1rem;">
          ${escapeHtml(post.title)}
        </h1>
        <p style="font-size: 1.2rem; color: var(--text-secondary); line-height: 1.6;">
          ${escapeHtml(post.description || '')}
        </p>
      </div>

      <div class="article-body" style="line-height: 1.8; font-size: 1.05rem; color: var(--text-primary);">
        ${bodyHtml}
      </div>

      ${relatedTools.length > 0 ? `
      <div style="margin-top: 3.5rem; padding: 1.75rem; background: var(--bg-surface-subtle); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
        <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.75rem;">Interactive Tools Mentioned in This Guide:</h3>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          ${relatedTools.map(t => `<a href="${escapeHtml(t)}" class="preset-chip active" style="text-decoration: none; padding: 0.5rem 1rem; font-weight: 700;">Open Tool ↗</a>`).join('')}
        </div>
      </div>
      ` : ''}
    </article>
  </main>

  <!-- Site Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        <div>© 2026 ClassPanel.online • Free Educational Tools for Teachers</div>
        <div style="display: flex; gap: 1.25rem;">
          <a href="/">Home</a>
          <a href="/tools/">All Tools</a>
          <a href="/blog/">Blog</a>
          <a href="/privacy/">Privacy Policy</a>
          <a href="/contact/">Contact</a>
        </div>
      </div>
    </div>
  </footer>

  <script defer src="/assets/js/common.js?v=21"></script>
</body>
</html>`;

    return new Response(fullHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    });
  } catch (err) {
    return context.next();
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function markdownToHtml(md) {
  if (!md) return '';
  let html = String(md)
    // Headings
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.35rem; font-weight: 800; margin: 1.75rem 0 0.5rem; color: var(--text-primary);">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.65rem; font-weight: 800; margin: 2rem 0 0.75rem; color: var(--text-primary);">$1</h2>')
    .replace(/^# (.*$)/gim, '<h2 style="font-size: 1.85rem; font-weight: 900; margin: 2.25rem 0 1rem; color: var(--text-primary);">$1</h2>')
    // Bold / Italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: var(--primary); font-weight: 600; text-decoration: underline;">$1</a>')
    // Lists
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li style="margin-bottom: 0.4rem;">$1</li>')
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li style="margin-bottom: 0.4rem;">$1</li>')
    // Paragraphs
    .replace(/\n\n+/g, '</p><p style="margin-bottom: 1.25rem;">');

  return `<p style="margin-bottom: 1.25rem;">${html}</p>`;
}
