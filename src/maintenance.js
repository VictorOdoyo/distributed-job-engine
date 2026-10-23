import { randomUUID } from 'node:crypto';
import { acquireLock, releaseLock } from './locks.js';
import { reap } from './reap.js';
import { fireSchedules } from './schedules.js';
/** Work itself remains transactional; the lease only reduces duplicate coordinator scans. */
export function maintenance(store, { owner = randomUUID() } = {}) {
  const lock = acquireLock(store, 'maintenance', owner, { ttlMs: 10000 });
  if (!lock) return { leader: false };
  try {
    return { leader: true, epoch: lock.epoch, ...reap(store), ...fireSchedules(store) };
  } finally {
    releaseLock(store, 'maintenance', lock.token);
  }
}
