import { randomUUID } from 'node:crypto';
import { name, integer } from './validation.js';
import { requireThat } from './errors.js';
import { getWorker } from './workers.js';
import { getJob } from './jobs.js';
import { emit } from './events.js';
export function claim(store, workerId, { leaseMs = 10000 } = {}) {
  name(workerId, 'Worker ID');
  integer(leaseMs, 'leaseMs', 100, 60000);
  return store.tx((now) => {
    const worker = getWorker(store, workerId);
    requireThat(
      worker.status === 'online' && worker.expires_at > now,
      'WORKER_UNAVAILABLE',
      'Worker is not live and accepting work',
      409,
    );
    const active = store.db
      .prepare("SELECT count(*) n FROM jobs WHERE state='running' AND lease_owner=?")
      .get(workerId).n;
    if (active >= worker.capacity) return null;
    const eligible = [];
    for (const queue of worker.queues) {
      const q = store.db.prepare('SELECT * FROM queues WHERE name=?').get(queue);
      if (!q || q.paused) continue;
      const count = store.db
        .prepare("SELECT count(*) n FROM jobs WHERE state='running' AND queue=?")
        .get(queue).n;
      if (count >= q.concurrency) continue;
      if (q.rate_limit && now < q.window_start + q.rate_window_ms && q.window_count >= q.rate_limit)
        continue;
      eligible.push(queue);
    }
    if (!eligible.length) return null;
    const row = store.db
      .prepare(
        "SELECT * FROM jobs WHERE state='waiting' AND run_at<=? AND queue IN (" +
          eligible.map(() => '?').join(',') +
          ') ORDER BY priority DESC,run_at,created_at,id LIMIT 1',
      )
      .get(now, ...eligible);
    if (!row) return null;
    const token = randomUUID(),
      until = now + Math.min(leaseMs, row.timeout_ms),
      number = row.attempts + 1;
    store.db
      .prepare(
        "UPDATE jobs SET state='running',attempts=?,lease_owner=?,lease_token=?,lease_until=?,started_at=?,updated_at=? WHERE id=?",
      )
      .run(number, workerId, token, until, now, now, row.id);
    store.db
      .prepare(
        "INSERT INTO attempts(job_id,number,token,worker_id,started_at,status) VALUES(?,?,?,?,?,'running')",
      )
      .run(row.id, number, token, workerId, now);
    const q = store.db.prepare('SELECT * FROM queues WHERE name=?').get(row.queue);
    store.db
      .prepare('UPDATE queues SET window_start=?,window_count=? WHERE name=?')
      .run(
        now >= q.window_start + q.rate_window_ms ? now : q.window_start,
        now >= q.window_start + q.rate_window_ms ? 1 : q.window_count + 1,
        row.queue,
      );
    const job = getJob(store, row.id);
    emit(store, now, 'job.claimed', job, { workerId, attempt: number, leaseUntil: until });
    return job;
  });
}
