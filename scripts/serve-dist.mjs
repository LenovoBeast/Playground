// Minimal static server for dist/ that mimics the production host: the site is
// mounted under /Playground/, and unknown paths fall back to index.html
// (SPA rewrite), exactly like netlify.toml configures.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist', import.meta.url));

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
};

export function startStaticServer(port = Number(process.env.PREVIEW_PORT ?? 4183)) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const rel = normalize(url.replace(/^\/Playground/, '') || '/');
    const file = rel === '/' ? join(root, 'index.html') : join(root, rel);
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(readFileSync(join(root, 'index.html')));
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${port}/Playground/` });
    });
  });
}
