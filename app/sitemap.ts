import { MetadataRoute } from 'next';

/**
 * Dynamic Sitemap configuration for ClassPanel.online
 * Generates sitemap compliant with Next.js MetadataRoute.Sitemap specification.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://classpanel.online';
  const lastModified = new Date('2026-09-17');

  // Interactive online tools (all 23 tools)
  const tools = [
    '/tools/classroom-timer/',
    '/tools/race-timers/',
    '/tools/holiday-timers/',
    '/tools/random-name-picker/',
    '/tools/random-number-generator/',
    '/tools/sensory-timer/',
    '/tools/clocks/',
    '/tools/exam-timer/',
    '/tools/chance-games/',
    '/tools/group-generator/',
    '/tools/presentation-timer/',
    '/tools/tally-counter/',
    '/tools/rock-paper-scissors/',
    '/tools/coin-flip/',
    '/tools/dice-roller/',
    '/tools/color-picker/',
    '/tools/stopwatch/',
    '/tools/metronome/',
    '/tools/chess-timer/',
    '/tools/talking-clock/',
    '/tools/bomb-countdown/',
    '/tools/custom-timer/',
    '/tools/split-timer/',
  ];

  // Blog guide articles
  const blogPosts = [
    '/blog/best-free-online-timer-for-studying-pomodoro/',
    '/blog/how-to-use-meditation-timer-for-mindfulness/',
    '/blog/rock-paper-scissors-rules-strategy-play-online/',
    '/blog/how-to-run-fair-classroom-raffle-name-draw/',
    '/blog/10-classroom-timer-tricks-to-keep-students-on-task/',
    '/blog/how-to-split-class-into-balanced-groups-fairly/',
    '/blog/best-practices-for-running-timed-exams/',
    '/blog/calming-classroom-transitions-sensory-timers/',
    '/blog/5-free-digital-tools-every-teacher-should-bookmark/',
  ];

  // Core information pages
  const staticPages = [
    '/tools/',
    '/blog/',
    '/about/',
    '/privacy/',
    '/contact/',
  ];

  return [
    // 1. Homepage
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // 2. All 12 Classroom Tools
    ...tools.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // 3. Blog & Content Hub
    ...staticPages.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    // 4. Practical Teacher Guides & Articles
    ...blogPosts.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
