/**
 * ClassPanel Admin API - Feedback & Bug Inbox Management
 * GET, PATCH, DELETE for user submissions
 */

import { verifyAdmin } from './_auth.js';

let mockFeedback = [
  {
    id: 1,
    name: 'Sarah Jenkins (Grade 4)',
    email: 's.jenkins@lincolnschool.edu',
    category: 'improvement',
    message: 'The Pomodoro timer has completely transformed our morning focus blocks! Could you add a 45-minute lesson preset?',
    page_url: '/tools/classroom-timer/',
    status: 'read',
    created_at: '2026-09-17 09:24:10'
  },
  {
    id: 2,
    name: 'Mr. Marcus Vance',
    email: 'm.vance@crestviewacademy.org',
    category: 'new-tool',
    message: 'Love the Group Generator! Would it be possible to add a Seating Chart layout in the future?',
    page_url: '/tools/group-generator/',
    status: 'unread',
    created_at: '2026-09-18 08:12:45'
  },
  {
    id: 3,
    name: 'Elena Rostova',
    email: 'e.rostova@physicsdept.edu',
    category: 'compliment',
    message: 'Official Exam Timer was perfect during our midterm physics exam. Zero distractions, clean interface.',
    page_url: '/tools/exam-timer/',
    status: 'resolved',
    created_at: '2026-09-16 14:05:30'
  }
];

export async function onRequest(context) {
  const auth = await verifyAdmin(context);
  if (!auth.authorized) return auth.response;

  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.DB;

  try {
    // --- GET /api/admin/feedback ---
    if (request.method === 'GET') {
      const statusFilter = url.searchParams.get('status') || 'all';

      if (db) {
        await db.prepare(`
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

        let query = 'SELECT * FROM feedback';
        const params = [];
        if (statusFilter !== 'all') {
          query += ' WHERE status = ?';
          params.push(statusFilter);
        }
        query += ' ORDER BY created_at DESC';

        const { results } = await db.prepare(query).bind(...params).all();
        return jsonResponse({ feedback: results || [], source: 'd1' });
      }

      let list = [...mockFeedback];
      if (statusFilter !== 'all') {
        list = list.filter(f => f.status === statusFilter);
      }
      return jsonResponse({ feedback: list, source: 'fallback' });
    }

    // --- PATCH /api/admin/feedback?id=... ---
    if (request.method === 'PATCH') {
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ error: 'Feedback ID is required.' }, 400);

      const body = await request.json();
      const newStatus = body.status; // 'unread', 'read', 'resolved'

      if (db) {
        await db.prepare('UPDATE feedback SET status = ? WHERE id = ?').bind(newStatus, id).run();
        return jsonResponse({ success: true, message: `Status updated to ${newStatus}.` });
      }

      const item = mockFeedback.find(f => String(f.id) === String(id));
      if (item) item.status = newStatus;
      return jsonResponse({ success: true, message: `Status updated to ${newStatus} (memory).` });
    }

    // --- DELETE /api/admin/feedback?id=... ---
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ error: 'Feedback ID is required.' }, 400);

      if (db) {
        await db.prepare('DELETE FROM feedback WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Feedback entry deleted.' });
      }

      mockFeedback = mockFeedback.filter(f => String(f.id) !== String(id));
      return jsonResponse({ success: true, message: 'Feedback entry deleted (memory).' });
    }

    return jsonResponse({ error: `Method ${request.method} not allowed` }, 405);
  } catch (err) {
    return jsonResponse({ error: 'Database error', message: err.message }, 500);
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
