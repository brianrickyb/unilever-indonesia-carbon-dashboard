// Server statis lokal untuk folder dist/. Pemakaian: npm run dev  (PORT=4174 npm run dev untuk port lain)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const port = Number(process.env.PORT) || 4173;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.csv': 'text/csv; charset=utf-8' };

http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = path.resolve(root, '.' + (p === '/' ? '/index.html' : p));
    if (!target.startsWith(root)) { res.writeHead(403); return res.end(); }
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).on('error', e => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} sudah dipakai. Jalankan dengan port lain, mis. PORT=4174 npm run dev` : e.message);
  process.exit(1);
}).listen(port, '127.0.0.1', () => console.log(`Dashboard: http://127.0.0.1:${port}`));
