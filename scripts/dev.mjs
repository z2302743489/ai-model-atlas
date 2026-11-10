import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, out } from './build.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

export function safePath(requestTarget, base = '/') {
  let pathname;
  try { pathname = decodeURIComponent(String(requestTarget).split('?')[0]); }
  catch { return { error: 400 }; }
  if (!pathname.startsWith('/') || /[\\\x00-\x1f\x7f]/.test(pathname) || pathname.split('/').includes('..')) {
    return { error: 400 };
  }
  if (base !== '/' && pathname === base.slice(0, -1)) return { redirect: base };
  if (!pathname.startsWith(base)) return { error: 404 };
  const local = pathname.slice(base.length);
  const target = resolve(out, local || 'index.html');
  const rel = relative(out, target);
  if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) return { error: 403 };
  return { target };
}

export async function startServer({ port = process.env.PORT || '4173', host = process.env.HOST || '127.0.0.1', basePath = process.env.BASE_PATH || '/' } = {}) {
  const listenPort = Number(port);
  if (!Number.isInteger(listenPort) || listenPort < 0 || listenPort > 65535) throw new Error('PORT 应为 0–65535 的整数。');
  if (!basePath.startsWith('/') || !basePath.endsWith('/') || /[\\?#\x00-\x20]/.test(basePath) || basePath.split('/').includes('..')) {
    throw new Error('BASE_PATH 应为 / 或 /仓库名/，且必须以斜杠开头和结尾。');
  }
  await build({ quiet: true });
  const canonicalRoot = await realpath(out);
  // Serialize rebuilds; reload a page after editing src/ to see the changes.
  let rebuild = Promise.resolve();
  const server = createServer(async (req, res) => {
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD'); return reply(405, 'Method not allowed');
    }
    const request = safePath(req.url || '/', basePath);
    if (request.error) return reply(request.error, 'Invalid path');
    if (request.redirect) { res.writeHead(302, { Location: request.redirect }); return res.end(); }
    try {
      if (extname(request.target) === '.html') {
        rebuild = rebuild.catch(() => {}).then(() => build({ quiet: true }));
      }
      await rebuild;
      const canonical = await realpath(request.target);
      const rel = relative(canonicalRoot, canonical);
      if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) return reply(403, 'Forbidden');
      const info = await stat(canonical);
      if (!info.isFile()) return reply(404, 'Not found');
      const content = await readFile(canonical);
      res.writeHead(200, {
        'Content-Type': MIME[extname(canonical).toLowerCase()] || 'application/octet-stream',
        'Content-Length': content.length, 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return reply(404, 'Not found');
      console.error(error.message); reply(500, 'Build or read failed; see the terminal.');
    }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(listenPort, host, done); });
  console.log('Preview: http://' + host + ':' + server.address().port + basePath);
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await startServer();
}
