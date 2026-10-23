import http from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { jobRoutes } from './api-jobs.js';
import { operationRoutes } from './api-operations.js';
import { matchRoute } from './router.js';
import { authorize, checkOrigin, validateToken } from './auth.js';
import { readJSON, sendJSON } from './http-json.js';
import { normalizeError, EngineError } from './errors.js';
import { RateLimiter } from './rate-limit.js';
import { prometheus } from './metrics.js';
const web = await realpath(fileURLToPath(new URL('../web', import.meta.url))).catch(() =>
  fileURLToPath(new URL('../web', import.meta.url)),
);
export function createServer(store, { token, rateLimit = true, extraRoutes = [] } = {}) {
  validateToken(token);
  const routes = [...jobRoutes(store), ...operationRoutes(store), ...extraRoutes],
    limiter = new RateLimiter();
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Request-ID', randomUUID());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/health' && req.method === 'GET') {
        store.db.prepare('SELECT 1').get();
        sendJSON(res, 200, {
          status: 'ok',
          version: '1.0.0',
          demo: extraRoutes.some((r) => r.path === '/api/demo'),
        });
        return;
      }
      if (url.pathname.startsWith('/api/') || url.pathname === '/metrics') {
        if (rateLimit && !limiter.allow(req.socket.remoteAddress ?? 'unknown'))
          throw new EngineError('RATE_LIMIT', 'Request rate exceeded', 429);
        authorize(req, token);
        if (!['GET', 'HEAD'].includes(req.method)) checkOrigin(req);
        if (url.pathname === '/metrics') {
          if (req.method !== 'GET') throw new EngineError('METHOD', 'Method not allowed', 405);
          res.writeHead(200, {
            'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
            'Cache-Control': 'no-store',
          });
          res.end(prometheus(store));
          return;
        }
        const matched = matchRoute(routes, req.method, url.pathname),
          body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readJSON(req);
        const result = await matched.route.handler({
          params: matched.params,
          query: url.searchParams,
          body,
          request: req,
        });
        sendJSON(res, matched.route.status ?? 200, result ?? null);
        return;
      }
      if (!['GET', 'HEAD'].includes(req.method))
        throw new EngineError('METHOD', 'Method not allowed', 405);
      const name =
        url.pathname === '/'
          ? 'index.html'
          : url.pathname.startsWith('/web/')
            ? decodeURIComponent(url.pathname.slice(5))
            : '';
      if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new EngineError('NOT_FOUND', 'Not found', 404);
      const target = await realpath(path.join(web, name));
      if (
        path.dirname(target) !== web ||
        !['.html', '.js', '.css', '.svg'].includes(path.extname(target))
      )
        throw new EngineError('NOT_FOUND', 'Not found', 404);
      const data = await readFile(target),
        types = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
        };
      res.writeHead(200, {
        'Content-Type': types[path.extname(target)] + '; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      const e =
        error?.code === 'ENOENT'
          ? new EngineError('NOT_FOUND', 'Not found', 404)
          : normalizeError(error);
      if (e.status === 429 || e.status === 503) res.setHeader('Retry-After', '1');
      if (e.status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
      sendJSON(res, e.status, { error: { code: e.code, message: e.message } });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return server;
}
