/**
 * ClassPanel Public API - Tool Rating (Thumbs Up / Thumbs Down)
 * Stores per-tool user ratings and optional comments in Cloudflare D1.
 * Zero login required, anonymous by default.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json().catch(() => ({}));

    const rating = body.rating === 'thumbs_up' ? 'thumbs_up' : 'thumbs_down';
    const toolName = (body.tool_name || '').slice(0, 100);
    const pageUrl = (body.page_url || body.path || '/').slice(0, 250);
    const comment = (body.comment || '').trim().slice(0, 1000);
    const category = body.category || (rating === 'thumbs_up' ? 'positive' : 'improvement');

    if (!toolName) {
      return jsonResponse({ error: 'tool_name is required.' }, 400);
    }

    if (env.DB) {
      // Ensure tool_ratings table exists
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS tool_ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tool_name TEXT NOT NULL,
          page_url TEXT,
          rating TEXT NOT NULL DEFAULT 'thumbs_up',
          comment TEXT,
          category TEXT DEFAULT 'positive',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run().catch(() => {});

      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_ratings_tool ON tool_ratings(tool_name)
      `).run().catch(() => {});

      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_ratings_created ON tool_ratings(created_at)
      `).run().catch(() => {});

      await env.DB.prepare(`
        INSERT INTO tool_ratings (tool_name, page_url, rating, comment, category, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(toolName, pageUrl, rating, comment || null, category).run();

      // If negative feedback with comment, also log to feedback table for admin visibility
      if (rating === 'thumbs_down' && comment) {
        await env.DB.prepare(`
          INSERT INTO feedback (name, email, category, message, page_url, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'unread', datetime('now'))
        `).bind(
          'Quick Rating Widget',
          '',
          'improvement',
          `[Tool: ${toolName}] ${comment}`,
          pageUrl
        ).run().catch(() => {});
      }
    }

    return jsonResponse({
      success: true,
      message: rating === 'thumbs_up'
        ? 'Thanks for the love!'
        : "Thanks for the feedback - we'll improve this!"
    });

  } catch (err) {
    return jsonResponse({ error: 'Failed to submit rating', message: err.message }, 500);
  }
}

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

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
