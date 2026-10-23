import { decode } from './codec.js';
import { getWorker } from './workers.js';
import { failIn } from './failure.js';
import { hydrate } from './jobs.js';
import { emit } from './events.js';
export function listWorkers(store) {
  const now = store.now();
  return store.db
    .prepare(
      "SELECT w.*,count(j.id) active FROM workers w LEFT JOIN jobs j ON j.lease_owner=w.id AND j.state='running' GROUP BY w.id ORDER BY w.created_at DESC,w.id LIMIT 500",
    )
    .all()
    .map((w) => ({
      ...w,
      queues: decode(w.queues),
      metadata: decode(w.metadata),
      live: w.status !== 'offline' && w.expires_at > now,
    }));
}
export function retireWorker(store, id) {
  return store.tx((now) => {
    getWorker(store, id);
    const active = store.db
      .prepare("SELECT * FROM jobs WHERE lease_owner=? AND state='running'")
      .all(id);
    store.db.prepare("UPDATE workers SET status='offline',last_seen=? WHERE id=?").run(now, id);
    for (const j of active)
      failIn(store, hydrate(j), now, {
        code: 'WORKER_SHUTDOWN',
        message: 'Worker retired before completion',
        retryable: true,
      });
    emit(store, now, 'worker.retired', null, { workerId: id, released: active.length });
    return { released: active.length };
  });
}
