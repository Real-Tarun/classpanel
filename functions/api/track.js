/**
 * ClassPanel Public API - Privacy-Friendly Event Tracker
 * Logs anonymous pageviews and tool engagements to Cloudflare D1
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const data = await request.json().catch(() => ({}));
    const path = data.path || '/';
    const toolName = data.tool_name || null;
    const referrer = data.referrer || request.headers.get('referer') || '';
    const eventType = data.event_type || 'pageview';

    // Disallow logging admin visits to public analytics
    if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO analytics_events (event_type, path, tool_name, referrer, timestamp)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(eventType, path, toolName, referrer).run().catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 200, // Do not throw error on telemetry
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// OPTIONS for CORS preflight if called cross-origin
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
