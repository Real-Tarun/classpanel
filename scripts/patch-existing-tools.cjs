/**
 * Patch existing tool pages:
 * 1. Add hreflang alternate tags after <link rel="canonical">
 * 2. Add i18n script loading before existing scripts
 * 
 * Run: node scripts/patch-existing-tools.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Only the 17 existing tools (not the 6 new ones which already have these)
const EXISTING_TOOLS = [
  'classroom-timer',
  'race-timers',
  'holiday-timers',
  'random-name-picker',
  'random-number-generator',
  'sensory-timer',
  'clocks',
  'exam-timer',
  'chance-games',
  'group-generator',
  'presentation-timer',
  'tally-counter',
  'rock-paper-scissors',
  'coin-flip',
  'dice-roller',
  'color-picker',
  'stopwatch',
];

let patched = 0, skipped = 0, errors = 0;

for (const slug of EXISTING_TOOLS) {
  const filePath = path.join(ROOT, 'tools', slug, 'index.html');
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  MISSING: ${filePath}`);
    errors++;
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // --- 1. Add hreflang tags after canonical ---
  const canonicalPattern = new RegExp(
    `(<link rel="canonical" href="https://classpanel\\.online/tools/${slug}/">)`,
    'i'
  );
  const hreflangBlock = `$1
  <link rel="alternate" hreflang="x-default" href="https://classpanel.online/tools/${slug}/">
  <link rel="alternate" hreflang="en" href="https://classpanel.online/tools/${slug}/">
  <link rel="alternate" hreflang="es" href="https://classpanel.online/es/tools/${slug}/">
  <link rel="alternate" hreflang="fr" href="https://classpanel.online/fr/tools/${slug}/">
  <link rel="alternate" hreflang="de" href="https://classpanel.online/de/tools/${slug}/">`;

  const alreadyHasHreflang = html.includes('hreflang="x-default"');
  if (!alreadyHasHreflang) {
    if (canonicalPattern.test(html)) {
      html = html.replace(canonicalPattern, hreflangBlock);
    } else {
      console.log(`⚠️  No canonical tag found in: ${slug}`);
    }
  }

  // --- 2. Add i18n scripts before audio.js / common.js ---
  const alreadyHasI18n = html.includes('/assets/js/i18n.js') || html.includes('/assets/i18n/en.js');
  if (!alreadyHasI18n) {
    // Insert before first <script src="/assets/js/audio.js or common.js
    const scriptPattern = /(<script\s[^>]*src="\/assets\/js\/(audio|common)\.js[^"]*"[^>]*><\/script>)/i;
    const i18nScripts = `<script src="/assets/i18n/en.js"></script>
  <script src="/assets/i18n/es.js"></script>
  <script src="/assets/i18n/fr.js"></script>
  <script src="/assets/i18n/de.js"></script>
  <script src="/assets/js/i18n.js"></script>
  $1`;
    if (scriptPattern.test(html)) {
      html = html.replace(scriptPattern, i18nScripts);
    } else {
      // fallback: add before </body>
      html = html.replace('</body>', `  <script src="/assets/i18n/en.js"></script>
  <script src="/assets/i18n/es.js"></script>
  <script src="/assets/i18n/fr.js"></script>
  <script src="/assets/i18n/de.js"></script>
  <script src="/assets/js/i18n.js"></script>
</body>`);
    }
  }

  // --- 3. Update CSS version v30 → v31 ---
  html = html.replace(/main\.css\?v=\d+/g, 'main.css?v=31');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Patched: /tools/${slug}/index.html`);
  patched++;
}

console.log(`\nDone: ${patched} patched, ${skipped} skipped, ${errors} errors.`);
