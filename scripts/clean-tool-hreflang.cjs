const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TOOLS_DIR = path.join(ROOT, 'tools');

const toolDirs = fs.readdirSync(TOOLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let modifiedCount = 0;

for (const dir of toolDirs) {
  const filePath = path.join(TOOLS_DIR, dir, 'index.html');
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Remove hreflang lines that point to localized /es/, /fr/, /de/ tool pages or redundant alternates
  content = content.replace(/[ \t]*<link rel="alternate" hreflang="(?:es|fr|de)" href="https:\/\/classpanel\.online\/(?:es|fr|de)\/tools\/[^"]+">\r?\n?/g, '');
  content = content.replace(/[ \t]*<link rel="alternate" hreflang="(?:x-default|en)" href="https:\/\/classpanel\.online\/tools\/[^"]+">\r?\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`Cleaned hreflang from: tools/${dir}/index.html`);
  }
}

console.log(`Successfully cleaned ${modifiedCount} tool pages.`);
