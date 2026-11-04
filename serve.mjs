// Servidor estático para desarrollo. `npm start` solo en esta computadora; `npm run lan` también en tu red.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};
const PUBLIC = /^(index\.html|manifest\.webmanifest|sw\.js|(css|js|icons)[\\/][^\\/]+)$/;

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname).slice(1) || 'index.html';
    path = normalize(path);
    if (!PUBLIC.test(path) || path.includes(`..${sep}`)) throw new Error('not public');
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}).listen(PORT, HOST, () => console.log(`Hojea en http://localhost:${PORT}`));
