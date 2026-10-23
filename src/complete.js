import { randomUUID } from 'node:crypto';
import { encode } from './codec.js';
import { name } from './validation.js';
import { requireThat } from './errors.js';
import { leasedJob, CLEAR_LEASE } from './fencing.js';
import { getJob } from './jobs.js';
import { emit } from './events.js';
import { settleDependencies } from './settle.js';
export function complete(store, id, token, result = null, { effects = [] } = {}) {
  const json = encode(result);
  requireThat(
    Array.isArray(effects) && effects.length <= 16,
    'VALIDATION',
    'At most 16 outbox effects',
  );
  const prepared = effects.map((e) => ({
    id: randomUUID(),
    topic: name(e.topic, 'Topic'),
    payload: encode(e.payload ?? {}),
  }));
  return store.tx((now) => {
    const job = leasedJob(store, id, token, now);
    store.db
      .prepare(
        "UPDATE jobs SET state='succeeded',result=?,error=NULL,finished_at=?,updated_at=?," +
          CLEAR_LEASE +
          ' WHERE id=?',
      )
      .run(json, now, now, id);
    store.db
      .prepare("UPDATE attempts SET status='succeeded',finished_at=? WHERE token=?")
      .run(now, token);
    for (const e of prepared)
      store.db
        .prepare('INSERT INTO outbox(id,job_id,topic,payload,created_at) VALUES(?,?,?,?,?)')
        .run(e.id, id, e.topic, e.payload, now);
    emit(store, now, 'job.succeeded', job, { attempt: job.attempts, effects: prepared.length });
    settleDependencies(store, now);
    return getJob(store, id);
  });
}
