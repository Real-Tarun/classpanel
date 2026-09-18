/**
 * ClassPanel Public API - Blog Posts & Guides
 * Serves published articles from Cloudflare D1 with automatic fallback
 */

const DEFAULT_POSTS = [
  {
    id: 1,
    slug: 'best-free-online-timer-for-studying-pomodoro',
    title: 'Best Free Online Timer for Studying (Pomodoro-Style)',
    description: 'Master deep work with the best free online study timer. Learn how 25/5 Pomodoro intervals, custom tabata pacing, and ambient focus sounds beat delay.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-17',
    category: 'Study Habits',
    badge_bg: 'var(--accent-emerald-light, #ECFDF5)',
    badge_color: 'var(--accent-emerald, #059669)',
    read_time: '5 min read'
  },
  {
    id: 2,
    slug: 'how-to-use-meditation-timer-for-mindfulness',
    title: 'How to Use a Meditation Timer for Daily Mindfulness Practice',
    description: 'Learn how to use an online meditation timer and visual breathing exercises to lower stress, build mindfulness habits, and calm classroom transitions.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-17',
    category: 'Mindfulness',
    badge_bg: 'var(--accent-purple-light, #EEF2FF)',
    badge_color: 'var(--accent-purple, #4F46E5)',
    read_time: '6 min read'
  },
  {
    id: 3,
    slug: 'rock-paper-scissors-rules-strategy-play-online',
    title: 'Rock Paper Scissors: Rules, Winning Strategy & Play Online Free',
    description: 'Master the game theory and psychology behind Rock Paper Scissors. Discover proven strategies to win matches and play free online against the computer.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-17',
    category: 'Game Theory',
    badge_bg: 'var(--accent-amber-light, #FEF3C7)',
    badge_color: 'var(--accent-amber, #D97706)',
    read_time: '7 min read'
  },
  {
    id: 4,
    slug: '10-classroom-timer-tricks-to-keep-students-on-task',
    title: '10 Classroom Timer Tricks to Keep Students on Task',
    description: 'Discover 10 proven classroom timer techniques that eliminate transition stalls, build student focus, and keep lesson pacing smoothly on track.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    category: 'Classroom Management',
    badge_bg: 'var(--accent-purple-light, #EEF2FF)',
    badge_color: 'var(--accent-purple, #4F46E5)',
    read_time: '6 min read'
  },
  {
    id: 5,
    slug: 'calming-classroom-transitions-sensory-timers',
    title: 'Using Sensory Timers for Calming Classroom Transitions',
    description: 'Discover how visual sensory timers and box breathing guides help young students de-escalate, transition smoothly, and regain focus without stress.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    category: 'Sensory & Focus',
    badge_bg: 'var(--accent-sky-light, #E0F2FE)',
    badge_color: 'var(--accent-sky, #0284C7)',
    read_time: '5 min read'
  },
  {
    id: 6,
    slug: 'how-to-split-class-into-balanced-groups-fairly',
    title: 'How to Split a Class into Balanced Groups Fairly',
    description: 'Master dynamic student grouping with strategic classroom pairing methods that eliminate student friction, boost collaboration, and save prep time.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    category: 'Group Work',
    badge_bg: 'var(--accent-amber-light, #FEF3C7)',
    badge_color: 'var(--accent-amber, #D97706)',
    read_time: '5 min read'
  },
  {
    id: 7,
    slug: 'best-practices-for-running-timed-exams',
    title: 'Best Practices for Running Timed Exams in Classrooms',
    description: 'Reduce student testing anxiety and maintain exam room integrity with clear visual countdowns, silent milestone warnings, and structured protocol.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    category: 'Assessment',
    badge_bg: 'var(--accent-rose-light, #FFE4E6)',
    badge_color: 'var(--accent-rose, #E11D48)',
    read_time: '6 min read'
  },
  {
    id: 8,
    slug: 'how-to-run-fair-classroom-raffle-name-draw',
    title: 'How to Run Fair Classroom Raffles Without Favoritism',
    description: 'Learn actionable strategies for transparent classroom raffles, student drawings, and turn-taking without student suspicion or teacher favoritism.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    category: 'Classroom Culture',
    badge_bg: 'var(--accent-emerald-light, #ECFDF5)',
    badge_color: 'var(--accent-emerald, #059669)',
    read_time: '5 min read'
  },
  {
    id: 9,
    slug: '5-free-digital-tools-every-teacher-should-bookmark',
    title: '5 Free Smartboard Digital Tools Every Teacher Needs',
    description: 'Explore the 5 essential, zero-cost digital tools every educator needs on their smartboard for timers, turn-taking, team generation, and test prep.',
    cover_image: '/assets/images/og-card.png',
    status: 'published',
    publish_date: '2026-09-15',
    category: 'Teacher Tech',
    badge_bg: 'var(--accent-purple-light, #EEF2FF)',
    badge_color: 'var(--accent-purple, #4F46E5)',
    read_time: '5 min read'
  }
];

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  const db = env.DB;

  try {
    if (db) {
      // Ensure posts table exists
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

      if (slug) {
        const post = await db.prepare(`
          SELECT * FROM posts 
          WHERE slug = ? AND (status = 'published' OR (status = 'scheduled' AND publish_date <= datetime('now')))
        `).bind(slug).first();

        if (post) {
          return jsonResponse({ post, source: 'd1' });
        }
        const fallback = DEFAULT_POSTS.find(p => p.slug === slug);
        if (fallback) return jsonResponse({ post: fallback, source: 'fallback' });
        return jsonResponse({ error: 'Post not found' }, 404);
      }

      // Fetch all published articles
      const { results } = await db.prepare(`
        SELECT id, slug, title, description, cover_image, status, publish_date, related_tools, created_at, updated_at
        FROM posts
        WHERE status = 'published' OR (status = 'scheduled' AND publish_date <= datetime('now'))
        ORDER BY publish_date DESC, created_at DESC
      `).all();

      if (results && results.length > 0) {
        return jsonResponse({ posts: results, source: 'd1' });
      }
    }

    // Fallback if D1 has no posts or DB not bound
    if (slug) {
      const item = DEFAULT_POSTS.find(p => p.slug === slug);
      if (!item) return jsonResponse({ error: 'Post not found' }, 404);
      return jsonResponse({ post: item, source: 'fallback' });
    }

    return jsonResponse({ posts: DEFAULT_POSTS, source: 'fallback' });
  } catch (err) {
    return jsonResponse({ posts: DEFAULT_POSTS, source: 'fallback-error', error: err.message });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
