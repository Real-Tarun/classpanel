/**
 * ClassPanel Admin API — Real Insights & Weekly Performance Brief
 * Synthesizes actual D1 data: top tools, engagement signals, feedback trends.
 * Falls back to baseline estimates when insufficient data exists.
 */

import { verifyAdmin } from './_auth.js';

const TOOL_SLUG_MAP = {
  'classroom-timer': 'Classroom Timer',
  'random-name-picker': 'Random Name Picker',
  'group-generator': 'Class Group Generator',
  'exam-timer': 'Official Exam Timer',
  'sensory-timer': 'Sensory Calming Timer',
  'clocks': 'Classroom Clocks',
  'random-number-generator': 'Random Number Generator',
  'chance-games': 'Chance Games & Mystery Hub',
  'tally-counter': 'Multi-Team Tally Counter',
  'presentation-timer': 'Presentation Timer',
  'race-timers': 'Fun Race Timers',
  'holiday-timers': 'Countdown to Any Date',
  'rock-paper-scissors': 'Rock Paper Scissors',
  'coin-flip': 'Flip a Coin Simulator',
  'dice-roller': 'Polyhedral Dice Roller',
  'color-picker': 'Color Picker & Converter',
  'stopwatch': 'Online Stopwatch & Laps'
};

export async function onRequest(context) {
  const auth = await verifyAdmin(context);
  if (!auth.authorized) return auth.response;

  const { env } = context;
  const db = env.DB;

  try {
    const reportDate = new Date().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    if (!db) {
      return jsonResponse(buildFallbackInsights(reportDate));
    }

    // ── 1. Total visits this week vs last week ────────────────────────────
    const thisWeekRow = await db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events
      WHERE timestamp >= datetime('now', '-7 days')
        AND path NOT LIKE '/admin%'
    `).first().catch(() => null);

    const lastWeekRow = await db.prepare(`
      SELECT COUNT(*) as count FROM analytics_events
      WHERE timestamp >= datetime('now', '-14 days')
        AND timestamp < datetime('now', '-7 days')
        AND path NOT LIKE '/admin%'
    `).first().catch(() => null);

    const thisWeek = thisWeekRow?.count || 0;
    const lastWeek = lastWeekRow?.count || 0;
    const growthPct = lastWeek > 0
      ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1)
      : null;
    const growthStr = growthPct !== null
      ? (growthPct >= 0 ? `+${growthPct}%` : `${growthPct}%`)
      : 'New';

    // ── 2. Top tools this week (by visits + actions) ───────────────────────
    const { results: topToolRows } = await db.prepare(`
      SELECT
        CASE
          WHEN tool_name IS NOT NULL AND tool_name != '' THEN tool_name
          ELSE REPLACE(REPLACE(path, '/tools/', ''), '/', '')
        END AS slug,
        COUNT(*) as count
      FROM analytics_events
      WHERE (path LIKE '/tools/%' OR tool_name IS NOT NULL)
        AND timestamp >= datetime('now', '-7 days')
      GROUP BY slug
      ORDER BY count DESC
      LIMIT 5
    `).all().catch(() => ({ results: [] }));

    const topTools = (topToolRows || [])
      .filter(r => r.slug && TOOL_SLUG_MAP[r.slug])
      .map(r => ({
        tool: TOOL_SLUG_MAP[r.slug] || r.slug,
        slug: r.slug,
        count: r.count
      }));

    // ── 3. Engagement score: tool_action / tool_pageview per tool ──────────
    const { results: engagementRows } = await db.prepare(`
      SELECT
        CASE
          WHEN tool_name IS NOT NULL AND tool_name != '' THEN tool_name
          ELSE REPLACE(REPLACE(path, '/tools/', ''), '/', '')
        END AS slug,
        SUM(CASE WHEN event_type = 'tool_action' THEN 1 ELSE 0 END) AS actions,
        SUM(CASE WHEN event_type = 'tool_pageview' OR event_type = 'pageview' THEN 1 ELSE 0 END) AS views
      FROM analytics_events
      WHERE (path LIKE '/tools/%' OR tool_name IS NOT NULL)
        AND timestamp >= datetime('now', '-7 days')
      GROUP BY slug
      HAVING views > 5
      ORDER BY (CAST(actions AS FLOAT) / views) ASC
      LIMIT 3
    `).all().catch(() => ({ results: [] }));

    const lowEngagement = (engagementRows || [])
      .filter(r => r.slug && TOOL_SLUG_MAP[r.slug])
      .map(r => ({
        tool: TOOL_SLUG_MAP[r.slug] || r.slug,
        slug: r.slug,
        engagementPct: r.views > 0 ? Math.round((r.actions / r.views) * 100) : 0
      }));

    // ── 4. Unread feedback count ───────────────────────────────────────────
    const unreadRow = await db.prepare(`
      SELECT COUNT(*) as count FROM feedback WHERE status = 'unread'
    `).first().catch(() => null);
    const unreadCount = unreadRow?.count || 0;

    // ── 5. Top requested features (category = 'new-tool') ─────────────────
    const { results: featureRequests } = await db.prepare(`
      SELECT message, page_url, created_at FROM feedback
      WHERE category = 'new-tool'
        AND created_at >= datetime('now', '-30 days')
      ORDER BY created_at DESC
      LIMIT 5
    `).all().catch(() => ({ results: [] }));

    // ── 6. Ratings summary (thumbs up/down per tool) ───────────────────────
    let ratingsData = [];
    try {
      const { results: ratingRows } = await db.prepare(`
        SELECT
          tool_name,
          SUM(CASE WHEN rating = 'thumbs_up'   THEN 1 ELSE 0 END) AS positive,
          SUM(CASE WHEN rating = 'thumbs_down' THEN 1 ELSE 0 END) AS negative,
          COUNT(*) as total
        FROM tool_ratings
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY tool_name
        ORDER BY total DESC
        LIMIT 3
      `).all();

      ratingsData = (ratingRows || []).map(r => ({
        tool: TOOL_SLUG_MAP[r.tool_name] || r.tool_name,
        positive: r.positive,
        negative: r.negative,
        total: r.total,
        approvalPct: r.total > 0 ? Math.round((r.positive / r.total) * 100) : null
      }));
    } catch (_) {
      // tool_ratings table may not exist yet — silently ignore
    }

    // ── 7. Most complained-about tools (negative ratings this week) ────────
    let mostComplaints = [];
    try {
      const { results: complaintsRows } = await db.prepare(`
        SELECT tool_name, COUNT(*) as count
        FROM tool_ratings
        WHERE rating = 'thumbs_down'
          AND created_at >= datetime('now', '-7 days')
        GROUP BY tool_name
        ORDER BY count DESC
        LIMIT 3
      `).all();
      mostComplaints = (complaintsRows || []).map(r => ({
        tool: TOOL_SLUG_MAP[r.tool_name] || r.tool_name,
        count: r.count
      }));
    } catch (_) {}

    // ── Build final insights object ────────────────────────────────────────
    const topToolNames = topTools.slice(0, 2).map(t => t.tool).join(' & ');
    const topSharePct = thisWeek > 0 && topTools.length >= 2
      ? Math.round(((topTools[0]?.count || 0) + (topTools[1]?.count || 0)) / thisWeek * 100)
      : 0;

    const insights = {
      generatedAt: reportDate,
      source: 'd1-live',
      headline: topToolNames
        ? `${topToolNames} Drive ${topSharePct}% of Weekly Traffic`
        : 'Weekly Performance Brief',
      executiveSummary: [
        thisWeek > 0 ? `Total visits this week: ${thisWeek.toLocaleString()} (${growthStr} vs last week).` : '',
        topTools.length > 0 ? `Top tool: ${topTools[0]?.tool} with ${topTools[0]?.count} sessions.` : '',
        unreadCount > 0 ? `${unreadCount} unread feedback submission${unreadCount > 1 ? 's' : ''} awaiting review.` : '',
        lowEngagement.length > 0 ? `Low engagement detected on: ${lowEngagement.map(t => t.tool).join(', ')}.` : ''
      ].filter(Boolean).join(' '),
      topTools,
      lowEngagementTools: lowEngagement,
      ratingsData,
      mostComplaints,
      featureRequests: (featureRequests || []).map(r => ({
        message: r.message,
        pageUrl: r.page_url,
        date: r.created_at
      })),
      metricsSnapshot: {
        weeklyVisits: thisWeek,
        weeklyGrowth: growthStr,
        topCategory: topTools.length > 0 ? `${topTools[0]?.tool}` : 'N/A',
        feedbackVolume: `${unreadCount} unread submission${unreadCount !== 1 ? 's' : ''}`,
        activeRatings: ratingsData.length > 0 ? `${ratingsData.reduce((s, r) => s + r.total, 0)} ratings collected` : 'No ratings yet',
        healthScore: '✅ Live D1 Data'
      },
      movers: buildMovers(topTools, mostComplaints, featureRequests || [])
    };

    return jsonResponse(insights);

  } catch (err) {
    return jsonResponse({ error: 'Failed to generate insights', message: err.message }, 500);
  }
}

function buildMovers(topTools, complaints, features) {
  const movers = [];

  topTools.slice(0, 3).forEach((t, i) => {
    movers.push({
      tool: t.tool,
      change: i === 0 ? '🔥 Top Tool' : `#${i + 1} This Week`,
      sentiment: 'positive',
      detail: `${t.count} sessions this week.`
    });
  });

  complaints.slice(0, 2).forEach(c => {
    movers.push({
      tool: c.tool,
      change: `${c.count} complaints`,
      sentiment: 'negative',
      detail: `${c.count} users clicked 👎 — check recent feedback for details.`
    });
  });

  if (features.length > 0) {
    movers.push({
      tool: 'Feature Requests',
      change: `${features.length} new`,
      sentiment: 'neutral',
      detail: `Latest: "${(features[0]?.message || '').slice(0, 80)}..."`
    });
  }

  return movers;
}

function buildFallbackInsights(reportDate) {
  return {
    generatedAt: reportDate,
    source: 'no-db',
    headline: 'Database Not Connected',
    executiveSummary: 'D1 database is not connected. Deploy to Cloudflare Pages to see real data.',
    topTools: [],
    lowEngagementTools: [],
    ratingsData: [],
    mostComplaints: [],
    featureRequests: [],
    movers: [],
    metricsSnapshot: {
      weeklyVisits: 0,
      weeklyGrowth: 'N/A',
      topCategory: 'N/A',
      feedbackVolume: '0 submissions',
      activeRatings: 'No ratings yet',
      healthScore: '⚠️ No D1 connection'
    }
  };
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
