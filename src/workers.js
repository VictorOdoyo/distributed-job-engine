import { randomUUID } from 'node:crypto';
import { name, integer, fields, record } from './validation.js';
import { encode, decode } from './codec.js';
import { requireThat, notFound } from './errors.js';
import { emit } from './events.js';
export function getWorker(store, id) {
  name(id, 'Worker ID');
  const row = store.db.prepare('SELECT * FROM workers WHERE id=?').get(id);
  if (!row) notFound('Worker');
  return { ...row, queues: decode(row.queues), metadata: decode(row.metadata) };
}
export function registerWorker(store, options = {}) {
  fields(options, ['id', 'capacity', 'queues', 'metadata', 'ttlMs']);
  const id = name(options.id ?? randomUUID(), 'Worker ID'),
    capacity = integer(options.capacity ?? 4, 'capacity', 1, 128),
    queues = options.queues ?? ['default'],
    ttl = integer(options.ttlMs ?? 30000, 'ttlMs', 1000, 300000),
    metadata = options.metadata ?? {};
  requireThat(
    Array.isArray(queues) &&
      queues.length > 0 &&
      queues.length <= 32 &&
      new Set(queues).size === queues.length,
    'VALIDATION',
    'Use 1..32 unique queues',
  );
  queues.forEach((q) => name(q, 'Queue'));
  record(metadata, 'metadata');
  const json = encode(metadata, 8192);
  return store.tx((now) => {
    requireThat(
      !store.db.prepare('SELECT 1 FROM workers WHERE id=?').get(id),
      'WORKER_EXISTS',
      'Worker ID already registered',
      409,
    );
    store.db
      .prepare("INSERT INTO workers VALUES(?,'online',?,?,?,?,?,?)")
      .run(id, capacity, encode(queues), json, now, now + ttl, now);
    emit(store, now, 'worker.registered', null, { workerId: id, capacity });
    return getWorker(store, id);
  });
}
export function touchWorker(store, id, { ttlMs = 30000 } = {}) {
  integer(ttlMs, 'ttlMs', 1000, 300000);
  return store.tx((now) => {
    const w = getWorker(store, id);
    requireThat(
      w.status !== 'offline',
      'WORKER_OFFLINE',
      'Offline worker must use a new identity',
      409,
    );
    store.db
      .prepare('UPDATE workers SET last_seen=?,expires_at=? WHERE id=?')
      .run(now, now + ttlMs, id);
    return getWorker(store, id);
  });
}
export function setWorkerStatus(store, id, status) {
  requireThat(
    ['online', 'draining', 'offline'].includes(status),
    'VALIDATION',
    'Invalid worker status',
  );
  return store.tx((now) => {
    getWorker(store, id);
    store.db.prepare('UPDATE workers SET status=?,last_seen=? WHERE id=?').run(status, now, id);
    emit(store, now, 'worker.status', null, { workerId: id, status });
    return getWorker(store, id);
  });
}
