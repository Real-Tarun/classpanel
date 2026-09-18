/**
 * ClassPanel Admin API - Blog Posts Management
 * GET, POST, PUT, DELETE with Cloudflare D1 integration and resilient fallback
 */

import { verifyAdmin } from './_auth.js';

// Fallback in-memory cache when D1 is not yet bound
let mockPosts = [
  {
    id: 1,
    slug: '10-classroom-timer-tricks-to-keep-students-on-task',
    title: '10 Classroom Timer Tricks to Keep Students on Task',
    description: 'Discover 10 proven classroom timer techniques that eliminate transition stalls, build student focus, and keep lesson pacing smoothly on track.',
    content: '## Master Lesson Pacing with Visual Timers\n\nClassroom transitions are where instructional momentum is most often lost. By incorporating clear visual countdown timers on the smartboard, educators create predictable rhythmic cues that students naturally align with.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    related_tools: JSON.stringify(['/tools/classroom-timer/', '/tools/presentation-timer/']),
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00'
  },
  {
    id: 2,
    slug: '5-free-digital-tools-every-teacher-should-bookmark',
    title: '5 Free Smartboard Digital Tools Every Teacher Needs',
    description: 'Explore the 5 essential, zero-cost digital tools every educator needs on their smartboard for timers, turn-taking, team generation, and test prep.',
    content: '## Essential Smartboard Toolkit\n\nModern classrooms benefit immensely from interactive, zero-clutter web utilities that require zero sign-up or logins.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    related_tools: JSON.stringify(['/tools/classroom-timer/', '/tools/random-name-picker/', '/tools/group-generator/']),
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00'
  },
  {
    id: 3,
    slug: 'best-free-online-timer-for-studying-pomodoro',
    title: 'Best Free Online Timer for Studying (Pomodoro-Style)',
    description: 'Master deep work with the best free online study timer. Learn how 25/5 Pomodoro intervals, custom tabata pacing, and ambient focus sounds beat delay.',
    content: '## How Pomodoro Pacing Drives Academic Flow\n\nThe Pomodoro Technique divides work into focused sprints (typically 25 minutes) separated by short breaks (5 minutes).',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-17',
    related_tools: JSON.stringify(['/tools/classroom-timer/', '/tools/stopwatch/']),
    created_at: '2026-09-17 10:00:00',
    updated_at: '2026-09-17 10:00:00'
  },
  {
    id: 4,
    slug: 'best-practices-for-running-timed-exams',
    title: 'Best Practices for Running Timed Exams in Classrooms',
    description: 'Reduce student testing anxiety and maintain exam room integrity with clear visual countdowns, silent milestone warnings, and structured protocol.',
    content: '## Standardized Exam Protocol\n\nExam invigilation requires absolute silence, clear instructions, and synced local real time.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    related_tools: JSON.stringify(['/tools/exam-timer/', '/tools/clocks/']),
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00'
  },
  {
    id: 5,
    slug: 'calming-classroom-transitions-sensory-timers',
    title: 'Using Sensory Timers for Calming Classroom Transitions',
    description: 'Discover how visual sensory timers and box breathing guides help young students de-escalate, transition smoothly, and regain focus without stress.',
    content: '## Emotional Regulation with Sensory Visuals\n\nFor neurodivergent students or energetic elementary classes, sudden auditory alarms can cause anxiety. Visual lava bubbles and guided 4-4-4-4 box breathing rhythms provide soothing visual de-escalation.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    related_tools: JSON.stringify(['/tools/sensory-timer/']),
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00'
  },
  {
    id: 6,
    slug: 'how-to-run-fair-classroom-raffle-name-draw',
    title: 'How to Run Fair Classroom Raffles Without Favoritism',
    description: 'Learn actionable strategies for transparent classroom raffles, student drawings, and turn-taking without student suspicion or teacher favoritism.',
    content: '## Building Student Trust Through Transparency\n\nUsing an interactive spinning wheel projected on the classroom smartboard ensures every student sees their name included and understands that every draw is 100% fair and unbiased.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    related_tools: JSON.stringify(['/tools/random-name-picker/', '/tools/random-number-generator/']),
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00'
  },
  {
    id: 7,
    slug: 'how-to-split-class-into-balanced-groups-fairly',
    title: 'How to Split a Class into Balanced Groups Fairly',
    description: 'Master dynamic student grouping with strategic classroom pairing methods that eliminate student friction, boost collaboration, and save prep time.',
    content: '## Fast, Fair Classroom Teams\n\nForming lab pairs, discussion circles, and study pods can cause anxiety if students feel excluded. Automated grouping with seed shuffling solves this instantly in one click.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    related_tools: JSON.stringify(['/tools/group-generator/']),
    created_at: '2026-09-15 10:00:00',
    updated_at: '2026-09-15 10:00:00'
  },
  {
    id: 8,
    slug: 'how-to-use-meditation-timer-for-mindfulness',
    title: 'How to Use a Meditation Timer for Daily Mindfulness Practice',
    description: 'Learn how to use an online meditation timer and visual breathing exercises to lower stress, build mindfulness habits, and calm classroom transitions.',
    content: '## Mindfulness in the Modern Classroom\n\nA 3-minute midday mindfulness pause with Tibetan singing bowls and visual breath bubbles sharpens afternoon student concentration and reduces teacher burnout.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-17',
    related_tools: JSON.stringify(['/tools/sensory-timer/']),
    created_at: '2026-09-17 10:00:00',
    updated_at: '2026-09-17 10:00:00'
  },
  {
    id: 9,
    slug: 'rock-paper-scissors-rules-strategy-play-online',
    title: 'Rock Paper Scissors: Rules, Winning Strategy & Play Online Free',
    description: 'Master the game theory and psychology behind Rock Paper Scissors. Discover proven strategies to win matches and play free online against the computer.',
    content: '## Game Theory & Heuristics of Rock Paper Scissors\n\nRock Paper Scissors is an engaging exploration of human behavioral bias, win-stay lose-shift heuristics, and probability theory.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-17',
    related_tools: JSON.stringify(['/tools/rock-paper-scissors/', '/tools/coin-flip/']),
    created_at: '2026-09-17 10:00:00',
    updated_at: '2026-09-17 10:00:00'
  }
];

export async function onRequest(context) {
  const auth = await verifyAdmin(context);
  if (!auth.authorized) return auth.response;

  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.DB;

  try {
    // --- GET /api/admin/posts ---
    if (request.method === 'GET') {
      const statusFilter = url.searchParams.get('status');
      const searchQuery = url.searchParams.get('q') || '';
      const id = url.searchParams.get('id');

      if (db) {
        // Ensure table exists
        await db.prepare(`
          CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            content TEXT NOT NULL,
            cover_image TEXT DEFAULT '/assets/images/og-card.png',
            status TEXT NOT NULL DEFAULT 'published',
            publish_date TEXT DEFAULT (datetime('now')),
            related_tools TEXT DEFAULT '[]',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
          )
        `).run().catch(() => {});

        if (id) {
          const post = await db.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
          if (!post) return jsonResponse({ error: 'Post not found' }, 404);
          return jsonResponse({ post });
        }

        let query = 'SELECT * FROM posts WHERE 1=1';
        const params = [];

        if (statusFilter && statusFilter !== 'all') {
          query += ' AND status = ?';
          params.push(statusFilter);
        }
        if (searchQuery) {
          query += ' AND (title LIKE ? OR content LIKE ?)';
          params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }
        query += ' ORDER BY created_at DESC';

        const { results } = await db.prepare(query).bind(...params).all();
        return jsonResponse({ posts: results || [], source: 'd1' });
      }

      // Fallback
      let list = [...mockPosts];
      if (id) {
        const item = list.find(p => String(p.id) === String(id));
        if (!item) return jsonResponse({ error: 'Post not found' }, 404);
        return jsonResponse({ post: item });
      }
      if (statusFilter && statusFilter !== 'all') {
        list = list.filter(p => p.status === statusFilter);
      }
      if (searchQuery) {
        list = list.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      return jsonResponse({ posts: list, source: 'fallback', note: 'D1 not bound; operating in high-performance local memory mode' });
    }

    // --- POST /api/admin/posts ---
    if (request.method === 'POST') {
      const data = await request.json();
      if (!data.title || !data.content) {
        return jsonResponse({ error: 'Title and content are required.' }, 400);
      }

      const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const status = data.status || 'draft';
      const publishDate = data.publish_date || new Date().toISOString();
      const relatedTools = Array.isArray(data.related_tools) ? JSON.stringify(data.related_tools) : (data.related_tools || '[]');

      if (db) {
        const res = await db.prepare(`
          INSERT INTO posts (slug, title, description, content, cover_image, status, publish_date, related_tools, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          slug,
          data.title,
          data.description || '',
          data.content,
          data.cover_image || '/assets/images/og-card.png',
          status,
          publishDate,
          relatedTools
        ).run();

        return jsonResponse({ success: true, message: 'Post created successfully.', id: res.meta.last_row_id, slug });
      }

      // Fallback
      const newPost = {
        id: Date.now(),
        slug,
        title: data.title,
        description: data.description || '',
        content: data.content,
        cover_image: data.cover_image || '/assets/images/og-card.png',
        status,
        publish_date: publishDate,
        related_tools: relatedTools,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      mockPosts.unshift(newPost);
      return jsonResponse({ success: true, message: 'Post created successfully (saved to memory).', post: newPost });
    }

    // --- PUT /api/admin/posts ---
    if (request.method === 'PUT') {
      const data = await request.json();
      const id = url.searchParams.get('id') || data.id;
      if (!id) return jsonResponse({ error: 'Post ID is required for update.' }, 400);

      const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const relatedTools = Array.isArray(data.related_tools) ? JSON.stringify(data.related_tools) : (data.related_tools || '[]');

      if (db) {
        await db.prepare(`
          UPDATE posts SET
            slug = ?,
            title = ?,
            description = ?,
            content = ?,
            cover_image = ?,
            status = ?,
            publish_date = ?,
            related_tools = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).bind(
          slug,
          data.title,
          data.description || '',
          data.content,
          data.cover_image || '/assets/images/og-card.png',
          data.status || 'draft',
          data.publish_date || new Date().toISOString(),
          relatedTools,
          id
        ).run();

        return jsonResponse({ success: true, message: 'Post updated successfully.', id, slug });
      }

      // Fallback
      const idx = mockPosts.findIndex(p => String(p.id) === String(id));
      if (idx === -1) return jsonResponse({ error: 'Post not found.' }, 404);
      mockPosts[idx] = {
        ...mockPosts[idx],
        ...data,
        slug,
        related_tools: relatedTools,
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };
      return jsonResponse({ success: true, message: 'Post updated successfully (memory).', post: mockPosts[idx] });
    }

    // --- DELETE /api/admin/posts ---
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ error: 'Post ID is required for deletion.' }, 400);

      if (db) {
        await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
        return jsonResponse({ success: true, message: 'Post deleted successfully.' });
      }

      mockPosts = mockPosts.filter(p => String(p.id) !== String(id));
      return jsonResponse({ success: true, message: 'Post deleted successfully (memory).' });
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
