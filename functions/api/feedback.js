/**
 * ClassPanel Public API - Feedback & Issue Report Submission
 * Stores visitor feedback in Cloudflare D1
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));
    const name = (body.name || 'Anonymous Educator').slice(0, 100);
    const email = (body.email || '').slice(0, 150);
    const category = body.category || 'general';
    const message = (body.message || '').trim().slice(0, 3000);
    const pageUrl = (body.page_url || '').slice(0, 250);

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO feedback (name, email, category, message, page_url, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'unread', datetime('now'))
      `).bind(name, email, category, message, pageUrl).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Feedback received! Thank you for helping improve ClassPanel.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to submit feedback', message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
