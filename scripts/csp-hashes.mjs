import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Prints sha256 CSP hashes for the inline JSON-LD blocks of a target HTML
// file. Usage: node scripts/csp-hashes.mjs [file]  (default: index.html)
const file = process.argv[2] ?? 'index.html';
const html = readFileSync(file, 'utf8');
const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
let m;
let i = 0;
while ((m = re.exec(html)) !== null) {
  i += 1;
  const hash = createHash('sha256').update(m[1], 'utf8').digest('base64');
  console.log(file + ' jsonld-' + i + " 'sha256-" + hash + "'");
}
