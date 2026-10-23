import { parseArgs } from 'node:util';
import path from 'node:path';
import { integer } from './validation.js';
import { requireThat } from './errors.js';
import { validateToken } from './auth.js';
export function serverConfig(args = [], env = {}) {
  const { values: v } = parseArgs({
    args,
    options: {
      port: { type: 'string' },
      host: { type: 'string' },
      db: { type: 'string' },
      demo: { type: 'boolean', default: false },
      'no-workers': { type: 'boolean', default: false },
    },
    strict: true,
  });
  const port = integer(Number(v.port ?? env.PORT ?? 4177), 'port', 0, 65535),
    host = v.host ?? env.HOST ?? '127.0.0.1',
    token = env.ENGINE_TOKEN;
  validateToken(token);
  requireThat(
    ['127.0.0.1', 'localhost', '::1'].includes(host) || !!token,
    'CONFIG',
    'Binding a non-loopback host requires ENGINE_TOKEN',
    500,
  );
  return {
    port,
    host,
    token,
    db: path.resolve(v.db ?? env.ENGINE_DB ?? 'data/engine.db'),
    demo: v.demo,
    noWorkers: v['no-workers'],
  };
}
export function workerConfig(args = [], env = {}) {
  const { values: v } = parseArgs({
    args,
    options: {
      url: { type: 'string' },
      queues: { type: 'string' },
      capacity: { type: 'string' },
      'max-jobs': { type: 'string' },
      handlers: { type: 'string' },
    },
    strict: true,
  });
  return {
    url: v.url ?? env.ENGINE_URL ?? 'http://127.0.0.1:4177',
    token: env.ENGINE_TOKEN,
    queues: (v.queues ?? 'default').split(','),
    capacity: integer(Number(v.capacity ?? 4), 'capacity', 1, 32),
    maxJobs:
      v['max-jobs'] === undefined
        ? Infinity
        : integer(Number(v['max-jobs']), 'max-jobs', 1, 1000000),
    handlers: v.handlers ? path.resolve(v.handlers) : undefined,
  };
}
