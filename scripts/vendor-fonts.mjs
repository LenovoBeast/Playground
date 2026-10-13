// One-off font vendoring helper. Downloads woff2 files and writes a local
// @font-face stylesheet. Kept for reproducibility (CDN URLs change over time).
// Usage: node scripts/vendor-fonts.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const outDir = resolve(root, 'src/assets/fonts');
mkdirSync(outDir, { recursive: true });

async function getCss(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`CSS fetch failed ${res.status}: ${url}`);
  return res.text();
}

// Every @font-face rule, with its preceding subset comment (if any).
function allFaces(css, family) {
  const out = [];
  const rule = /@font-face\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = rule.exec(css)) !== null) {
    const body = m[1];
    const before = css.slice(0, m.index);
    const comment = /\/\*\s*([a-z-]+)\s*\*\/\s*$/i.exec(before)?.[1]?.toLowerCase() ?? 'all';
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const raw = /url\((['"]?)(\/\/[^)'"]+\.woff2|https:\/\/[^)'"]+\.woff2)\1\)/.exec(body)?.[2];
    if (weight && raw) out.push({ family, weight, subset: comment, url: raw.startsWith('//') ? `https:${raw}` : raw });
  }
  return out;
}

async function vendor(cssUrl, family, filePrefix, onlySubset) {
  const css = await getCss(cssUrl);
  const faces = allFaces(css, family).filter((f) => !onlySubset || f.subset === onlySubset);
  const saved = [];
  for (const face of faces) {
    const file = `${filePrefix}-${face.weight}.woff2`;
    const res = await fetch(face.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`font fetch failed ${res.status}: ${face.url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(resolve(outDir, file), buf);
    saved.push({ ...face, file, bytes: buf.length });
    console.log(`${file}  ${(buf.length / 1024).toFixed(1)} kB  (${face.subset})`);
  }
  return saved;
}

const satoshi = await vendor(
  'https://api.fontshare.com/v2/css?f%5B%5D=satoshi@400,500,700,900&display=swap',
  'Satoshi', 'satoshi', null
);
const mono = await vendor(
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
  'JetBrains Mono', 'jetbrains-mono', 'latin'
);

if (!satoshi.length || !mono.length) throw new Error('no fonts downloaded — check selectors');

const rules = [];
for (const f of [...satoshi, ...mono]) {
  rules.push(`@font-face {
  font-family: '${f.family}';
  font-style: normal;
  font-weight: ${f.weight};
  font-display: swap;
  src: url('./src/assets/fonts/${f.file}') format('woff2');
}`);
}
writeFileSync(resolve(root, 'src/assets/fonts/fonts.css'), `${rules.join('\n\n')}\n`);
console.log('wrote src/assets/fonts/fonts.css with', rules.length, 'faces');
