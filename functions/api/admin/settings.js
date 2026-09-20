/**
 * ClassPanel Admin API - Site Settings & Announcement Banner
 * GET and POST settings in Cloudflare D1
 */

import { verifyAdmin } from './_auth.js';

let mockSettings = {
  announcement_active: 'false',
  announcement_text: 'Welcome to ClassPanel! Explore our 17+ free classroom timers and randomizers.',
  announcement_type: 'info',
  announcement_link: '/tools/',
  pinned_tools: JSON.stringify(['classroom-timer', 'random-name-picker', 'group-generator', 'exam-timer'])
};

export async function onRequest(context) {
  const auth = await verifyAdmin(context);
  if (!auth.authorized) return auth.response;

  const { request, env } = context;
  const db = env.DB;

  try {
    if (request.method === 'GET') {
      if (db) {
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS site_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `).run().catch(() => {});

        const { results } = await db.prepare('SELECT key, value FROM site_settings').all();
        const settings = { ...mockSettings };
        let hasCustomPasscode = false;
        if (results && results.length > 0) {
          results.forEach(row => {
            if (row.key === 'admin_passcode') {
              hasCustomPasscode = true;
            } else {
              settings[row.key] = row.value;
            }
          });
        }
        settings.has_custom_passcode = hasCustomPasscode;
        return jsonResponse({ success: true, settings });
      }

      return jsonResponse({ success: true, settings: mockSettings, source: 'fallback' });
    }

    if (request.method === 'POST') {
      const data = await request.json();
      if (!data || typeof data !== 'object') {
        return jsonResponse({ error: 'Invalid settings payload' }, 400);
      }

      // Handle password change request
      const newPass = data.new_passcode || data.admin_passcode;
      if (newPass !== undefined) {
        const passStr = String(newPass).trim();
        if (passStr.length < 6) {
          return jsonResponse({ error: 'New passcode must be at least 6 characters long.' }, 400);
        }
        if (db) {
          await db.prepare(`
            INSERT INTO site_settings (key, value, updated_at)
            VALUES ('admin_passcode', ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
          `).bind(passStr).run();
        }
        mockSettings.has_custom_passcode = true;
      }

      if (db) {
        for (const [key, value] of Object.entries(data)) {
          if (key === 'new_passcode' || key === 'admin_passcode') continue;
          await db.prepare(`
            INSERT INTO site_settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
          `).bind(key, String(value)).run();
        }
        return jsonResponse({ success: true, message: 'Settings saved to D1 successfully.' });
      }

      for (const [key, value] of Object.entries(data)) {
        if (key === 'new_passcode' || key === 'admin_passcode') continue;
        mockSettings[key] = String(value);
      }
      return jsonResponse({ success: true, message: 'Settings saved (memory mode).' });
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
  } catch (err) {
    return jsonResponse({ error: 'Settings error', message: err.message }, 500);
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
