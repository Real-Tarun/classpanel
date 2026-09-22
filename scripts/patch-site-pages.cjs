/**
 * Patch site-wide pages (homepage already done):
 * - /tools/index.html (hub/directory page)
 * - /about/index.html
 * - /privacy/index.html
 * - /contact/index.html
 * - /blog/index.html
 * 
 * Adds i18n scripts before </body>
 * Updates CSS version v30 → v31
 * 
 * Run: node scripts/patch-site-pages.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = [
  'tools/index.html',
  'about/index.html',
  'privacy/index.html',
  'contact/index.html',
  'blog/index.html',
];

const I18N_SCRIPTS = `  <script src="/assets/i18n/en.js"></script>
  <script src="/assets/i18n/es.js"></script>
  <script src="/assets/i18n/fr.js"></script>
  <script src="/assets/i18n/de.js"></script>
  <script src="/assets/js/i18n.js"></script>
`;

let patched = 0;

for (const rel of PAGES) {
  const filePath = path.join(ROOT, rel);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  MISSING: ${rel}`);
    continue;
  }

  let html = fs.readFileSync(filePath, 'utf8');

  // Skip if already has i18n
  if (html.includes('/assets/js/i18n.js')) {
    console.log(`⏭️  Already has i18n: ${rel}`);
    continue;
  }

  // Inject before first audio.js or common.js script tag
  const scriptPattern = /(<script\s[^>]*src="\/assets\/js\/(audio|common)\.js[^"]*"[^>]*><\/script>)/i;
  if (scriptPattern.test(html)) {
    html = html.replace(scriptPattern, I18N_SCRIPTS + '  $1');
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', I18N_SCRIPTS + '</body>');
  }

  // Update CSS version
  html = html.replace(/main\.css\?v=\d+/g, 'main.css?v=31');

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`✅ Patched: ${rel}`);
  patched++;
}

console.log(`\nDone: ${patched} pages patched.`);
