import { integer } from './validation.js';
import { leasedJob } from './fencing.js';
import { getJob } from './jobs.js';
export function heartbeat(store, id, token, { leaseMs = 10000 } = {}) {
  integer(leaseMs, 'leaseMs', 100, 60000);
  return store.tx((now) => {
    const j = leasedJob(store, id, token, now),
      until = Math.min(now + leaseMs, j.started_at + j.timeout_ms);
    store.db.prepare('UPDATE jobs SET lease_until=?,updated_at=? WHERE id=?').run(until, now, id);
    return getJob(store, id);
  });
}
