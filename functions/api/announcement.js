/**
 * Public Announcement Banner API
 * Reads active banner from Cloudflare D1
 */

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  try {
    if (db) {
      const activeRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'announcement_active'").first();
      if (activeRow && activeRow.value === 'true') {
        const textRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'announcement_text'").first();
        const typeRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'announcement_type'").first();
        const linkRow = await db.prepare("SELECT value FROM site_settings WHERE key = 'announcement_link'").first();

        return new Response(JSON.stringify({
          active: true,
          text: textRow ? textRow.value : '',
          type: typeRow ? typeRow.value : 'info',
          link: linkRow ? linkRow.value : ''
        }), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=60'
          }
        });
      }
    }

    return new Response(JSON.stringify({ active: false }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (_) {
    return new Response(JSON.stringify({ active: false }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
