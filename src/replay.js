import { getJob } from './jobs.js';
import { submitIn } from './submit.js';
import { requireThat } from './errors.js';
import { emit } from './events.js';
export function replayIn(store, id, now) {
  const j = getJob(store, id);
  requireThat(
    ['failed', 'cancelled'].includes(j.state),
    'INVALID_STATE',
    'Only failed or cancelled jobs can be replayed',
    409,
  );
  requireThat(
    !j.workflow_id,
    'WORKFLOW_REPLAY',
    'Replay workflows as a new graph to preserve dependency semantics',
    409,
  );
  const next = submitIn(
    store,
    {
      queue: j.queue,
      kind: j.kind,
      payload: j.payload,
      priority: j.priority,
      maxAttempts: j.max_attempts,
      backoffBase: j.backoff_base,
      backoffCap: j.backoff_cap,
      timeoutMs: j.timeout_ms,
      tags: j.tags,
      traceId: j.trace_id,
    },
    now,
  );
  store.db.prepare('UPDATE jobs SET replayed_from=? WHERE id=?').run(id, next.job.id);
  emit(store, now, 'job.replayed', next.job, { sourceJobId: id });
  return getJob(store, next.job.id);
}
export function replay(store, id) {
  return store.tx((now) => replayIn(store, id, now));
}
export function replayBatch(store, ids) {
  requireThat(
    Array.isArray(ids) && ids.length > 0 && ids.length <= 100 && new Set(ids).size === ids.length,
    'VALIDATION',
    'Replay requires 1..100 unique IDs',
  );
  return store.tx((now) => ids.map((id) => replayIn(store, id, now)));
}
