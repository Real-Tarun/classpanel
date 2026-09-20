-- ==============================================================================
-- ClassPanel D1 Database Schema
-- Tables: posts, analytics_events, feedback, site_settings
-- ==============================================================================

-- 1. Blog Posts
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  cover_image TEXT DEFAULT '/assets/images/og-card.png',
  status TEXT NOT NULL DEFAULT 'published', -- 'draft', 'scheduled', 'published'
  publish_date TEXT DEFAULT (datetime('now')),
  related_tools TEXT DEFAULT '[]', -- JSON array of related tool links
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_pubdate ON posts(publish_date);

-- 2. Privacy-Respecting Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL DEFAULT 'pageview', -- 'pageview', 'tool_action'
  path TEXT NOT NULL,
  tool_name TEXT,
  referrer TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_path ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_tool ON analytics_events(tool_name);

-- 3. Feedback & Bug Reports
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'bug', 'new-tool', 'improvement', 'compliment', 'other'
  message TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'resolved'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- 4. Site Settings & Key-Value Storage
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Tool Ratings (In-page thumbs up / thumbs down widget)
CREATE TABLE IF NOT EXISTS tool_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name TEXT NOT NULL,           -- slug e.g. 'classroom-timer'
  page_url TEXT,                     -- full path e.g. '/tools/classroom-timer/'
  rating TEXT NOT NULL DEFAULT 'thumbs_up', -- 'thumbs_up' | 'thumbs_down'
  comment TEXT,                      -- optional user comment (max 1000 chars)
  category TEXT DEFAULT 'positive',  -- 'positive' | 'improvement' | 'suggest'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ratings_tool ON tool_ratings(tool_name);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON tool_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON tool_ratings(rating);

-- ==============================================================================
-- Initial Seed Data: Existing 9 Blog Posts
-- ==============================================================================
INSERT OR IGNORE INTO posts (slug, title, description, content, status, publish_date, related_tools) VALUES
(
  '10-classroom-timer-tricks-to-keep-students-on-task',
  '10 Classroom Timer Tricks to Keep Students on Task',
  'Discover 10 proven classroom timer techniques that eliminate transition stalls, build student focus, and keep lesson pacing smoothly on track.',
  '## Master Lesson Pacing with Visual Timers\n\nClassroom transitions are where instructional momentum is most often lost. By incorporating clear visual countdown timers on the smartboard, educators create predictable rhythmic cues that students naturally align with.\n\n### 1. The Two-Minute Bell Ringer\nStart class immediately with a 2-minute countdown for do-now assignments.\n\n### 2. Silent Sprint Transitions\nChallenge the class to clean up and open binders before the bar empties.\n\n### 3. Pomodoro Chunking for Study\nUse 25 minutes of direct work followed by 5 minutes of mindful stretch.',
  'published',
  '2026-09-15',
  '["/tools/classroom-timer/", "/tools/presentation-timer/"]'
),
(
  '5-free-digital-tools-every-teacher-should-bookmark',
  '5 Free Smartboard Digital Tools Every Teacher Needs',
  'Explore the 5 essential, zero-cost digital tools every educator needs on their smartboard for timers, turn-taking, team generation, and test prep.',
  '## Essential Smartboard Toolkit\n\nModern classrooms benefit immensely from interactive, zero-clutter web utilities that require zero sign-up or logins.\n\n1. **Classroom Timer & Focus Clock**: Giant legible digits, audio bells, and background focus music.\n2. **Random Name Picker Wheel**: Transparent student selection without accusations of favoritism.\n3. **Random Group Generator**: Instant team balancing with pair/group modes.\n4. **Official Exam Timer**: Silent milestone cues for assessments.\n5. **Meditation & Sensory Timer**: Soothing breathing pacers for calm classroom transitions.',
  'published',
  '2026-09-15',
  '["/tools/classroom-timer/", "/tools/random-name-picker/", "/tools/group-generator/"]'
),
(
  'best-free-online-timer-for-studying-pomodoro',
  'Best Free Online Timer for Studying (Pomodoro-Style)',
  'Master deep work with the best free online study timer. Learn how 25/5 Pomodoro intervals, custom tabata pacing, and ambient focus sounds beat delay.',
  '## How Pomodoro Pacing Drives Academic Flow\n\nThe Pomodoro Technique divides work into focused sprints (typically 25 minutes) separated by short breaks (5 minutes). ClassPanel study timer incorporates binaural and lo-fi audio tracks alongside high-contrast digits for peak focus.',
  'published',
  '2026-09-17',
  '["/tools/classroom-timer/", "/tools/stopwatch/"]'
),
(
  'best-practices-for-running-timed-exams',
  'Best Practices for Running Timed Exams in Classrooms',
  'Reduce student testing anxiety and maintain exam room integrity with clear visual countdowns, silent milestone warnings, and structured protocol.',
  '## Standardized Exam Protocol\n\nExam invigilation requires absolute silence, clear instructions, and synced local real time. ClassPanel Official Exam Timer delivers synchronized live wall clocks, reading time stages, and silent 15-minute / 5-minute milestone banners.',
  'published',
  '2026-09-15',
  '["/tools/exam-timer/", "/tools/clocks/"]'
),
(
  'calming-classroom-transitions-sensory-timers',
  'Using Sensory Timers for Calming Classroom Transitions',
  'Discover how visual sensory timers and box breathing guides help young students de-escalate, transition smoothly, and regain focus without stress.',
  '## Emotional Regulation with Sensory Visuals\n\nFor neurodivergent students or energetic elementary classes, sudden auditory alarms can cause anxiety. Visual lava bubbles and guided 4-4-4-4 box breathing rhythms provide soothing visual de-escalation.',
  'published',
  '2026-09-15',
  '["/tools/sensory-timer/"]'
),
(
  'how-to-run-fair-classroom-raffle-name-draw',
  'How to Run Fair Classroom Raffles Without Favoritism',
  'Learn actionable strategies for transparent classroom raffles, student drawings, and turn-taking without student suspicion or teacher favoritism.',
  '## Building Student Trust Through Transparency\n\nUsing an interactive spinning wheel projected on the classroom smartboard ensures every student sees their name included and understands that every draw is 100% fair and unbiased.',
  'published',
  '2026-09-15',
  '["/tools/random-name-picker/", "/tools/random-number-generator/"]'
),
(
  'how-to-split-class-into-balanced-groups-fairly',
  'How to Split a Class into Balanced Groups Fairly',
  'Master dynamic student grouping with strategic classroom pairing methods that eliminate student friction, boost collaboration, and save prep time.',
  '## Fast, Fair Classroom Teams\n\nForming lab pairs, discussion circles, and study pods can cause anxiety if students feel excluded. Automated grouping with seed shuffling solves this instantly in one click.',
  'published',
  '2026-09-15',
  '["/tools/group-generator/"]'
),
(
  'how-to-use-meditation-timer-for-mindfulness',
  'How to Use a Meditation Timer for Daily Mindfulness Practice',
  'Learn how to use an online meditation timer and visual breathing exercises to lower stress, build mindfulness habits, and calm classroom transitions.',
  '## Mindfulness in the Modern Classroom\n\nA 3-minute midday mindfulness pause with Tibetan singing bowls and visual breath bubbles sharpens afternoon student concentration and reduces teacher burnout.',
  'published',
  '2026-09-17',
  '["/tools/sensory-timer/"]'
),
(
  'rock-paper-scissors-rules-strategy-play-online',
  'Rock Paper Scissors: Rules, Winning Strategy & Play Online Free',
  'Master the game theory and psychology behind Rock Paper Scissors. Discover proven strategies to win matches and play free online against the computer.',
  '## Game Theory & Heuristics of Rock Paper Scissors\n\nRock Paper Scissors is an engaging exploration of human behavioral bias, win-stay lose-shift heuristics, and probability theory.',
  'published',
  '2026-09-17',
  '["/tools/rock-paper-scissors/", "/tools/coin-flip/"]'
);

-- Initial Feedback Seed
INSERT OR IGNORE INTO feedback (name, email, category, message, page_url, status) VALUES
('Sarah Jenkins (Grade 4)', 's.jenkins@lincolnschool.edu', 'improvement', 'The Pomodoro timer has completely transformed our morning focus blocks! Could you add a 45-minute lesson preset?', '/tools/classroom-timer/', 'read'),
('Mr. Marcus Vance', 'm.vance@crestviewacademy.org', 'new-tool', 'Love the Group Generator! Would it be possible to add a Seating Chart layout in the future?', '/tools/group-generator/', 'unread'),
('Elena Rostova', 'e.rostova@physicsdept.edu', 'compliment', 'Official Exam Timer was perfect during our midterm physics exam. Zero distractions.', '/tools/exam-timer/', 'resolved');
