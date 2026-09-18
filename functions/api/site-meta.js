/**
 * ClassPanel Public API - Site Metadata (Announcement Banner & Pinned Tools)
 * Read by public pages to dynamically display announcements and pinned tools
 */

export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;

  let announcement = {
    active: false,
    text: '',
    type: 'info',
    link: ''
  };

  let pinnedTools = [
    'classroom-timer',
    'random-name-picker',
    'group-generator',
    'exam-timer'
  ];

  if (db) {
    try {
      const { results } = await db.prepare("SELECT key, value FROM site_settings").all();
      if (results && results.length > 0) {
        results.forEach(row => {
          if (row.key === 'announcement_active') announcement.active = (row.value === 'true');
          if (row.key === 'announcement_text') announcement.text = row.value;
          if (row.key === 'announcement_type') announcement.type = row.value;
          if (row.key === 'announcement_link') announcement.link = row.value;
          if (row.key === 'pinned_tools') {
            try {
              const parsed = JSON.parse(row.value);
              if (Array.isArray(parsed)) pinnedTools = parsed;
            } catch (_) {}
          }
        });
      }
    } catch (_) {}
  }

  return new Response(JSON.stringify({
    success: true,
    announcement,
    pinned_tools: pinnedTools
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=10'
    }
  });
}
