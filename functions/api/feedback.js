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
    const pageUrl = (body.page_url || body.page_path || body.path || '/contact/').slice(0, 250);
    const deviceId = (body.device_id || '').slice(0, 64);
    const gotcha = body._gotcha || body.website_url;

    // 1. Invisible Honeypot: Drop bot submissions silently
    if (gotcha) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Feedback received! Thank you for helping improve ClassPanel.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message cannot be empty.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '';
    const country = request.headers.get('cf-ipcountry') || '';
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 250);

    if (env.DB) {
      // 2. Ensure blocked_visitors table exists
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS blocked_visitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ip TEXT UNIQUE,
          device_id TEXT,
          reason TEXT DEFAULT 'Spam from Contact Box',
          feedback_id INTEGER,
          blocked_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run().catch(() => {});
      await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_blocked_ip ON blocked_visitors(ip)`).run().catch(() => {});
      await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_blocked_device ON blocked_visitors(device_id)`).run().catch(() => {});

      // 3. Check if IP or device_id is currently blocked
      if (ip || deviceId) {
        let isBlocked = null;
        if (ip && deviceId) {
          isBlocked = await env.DB.prepare(
            'SELECT id FROM blocked_visitors WHERE ip = ? OR (device_id IS NOT NULL AND device_id = ?) LIMIT 1'
          ).bind(ip, deviceId).first().catch(() => null);
        } else if (ip) {
          isBlocked = await env.DB.prepare(
            'SELECT id FROM blocked_visitors WHERE ip = ? LIMIT 1'
          ).bind(ip).first().catch(() => null);
        } else if (deviceId) {
          isBlocked = await env.DB.prepare(
            'SELECT id FROM blocked_visitors WHERE device_id = ? LIMIT 1'
          ).bind(deviceId).first().catch(() => null);
        }

        if (isBlocked) {
          // Silent Shadowban: Return success so the spammer thinks it sent, but drop message completely
          return new Response(JSON.stringify({
            success: true,
            message: 'Feedback received! Thank you for helping improve ClassPanel.'
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        }
      }

      // 4. Ensure feedback table and columns exist
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          email TEXT,
          category TEXT NOT NULL DEFAULT 'general',
          message TEXT NOT NULL,
          page_url TEXT,
          status TEXT NOT NULL DEFAULT 'unread',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).run().catch(() => {});

      // Migrate new tracking columns gracefully
      await env.DB.prepare(`ALTER TABLE feedback ADD COLUMN ip TEXT`).run().catch(() => {});
      await env.DB.prepare(`ALTER TABLE feedback ADD COLUMN country TEXT`).run().catch(() => {});
      await env.DB.prepare(`ALTER TABLE feedback ADD COLUMN device_id TEXT`).run().catch(() => {});
      await env.DB.prepare(`ALTER TABLE feedback ADD COLUMN user_agent TEXT`).run().catch(() => {});

      await env.DB.prepare(`
        INSERT INTO feedback (name, email, category, message, page_url, status, ip, country, device_id, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, 'unread', ?, ?, ?, ?, datetime('now'))
      `).bind(name, email, category, message, pageUrl, ip, country, deviceId, userAgent).run();
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
