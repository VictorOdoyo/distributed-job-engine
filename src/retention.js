import { integer } from './validation.js';
import { emit } from './events.js';
/** Explicit opt-in cleanup preserves active dedup keys, workflows, schedules and undelivered effects. */
export function prune(store, { before, limit = 500 } = {}) {
  integer(before, 'before');
  integer(limit, 'limit', 1, 5000);
  return store.tx((now) => {
    const candidates = store.db
      .prepare(
        "SELECT j.id FROM jobs j WHERE j.state IN('succeeded','failed','cancelled') AND j.finished_at<? AND j.workflow_id IS NULL AND NOT EXISTS(SELECT 1 FROM schedule_runs s WHERE s.job_id=j.id) AND NOT EXISTS(SELECT 1 FROM dedup d WHERE d.job_id=j.id AND d.expires_at>?) AND NOT EXISTS(SELECT 1 FROM outbox o WHERE o.job_id=j.id AND o.state!='delivered') AND NOT EXISTS(SELECT 1 FROM jobs r WHERE r.replayed_from=j.id) ORDER BY j.finished_at,j.id LIMIT ?",
      )
      .all(before, now, limit);
    for (const j of candidates) store.db.prepare('DELETE FROM jobs WHERE id=?').run(j.id);
    store.db.prepare('DELETE FROM dedup WHERE expires_at<=?').run(now);
    emit(store, now, 'retention.pruned', null, { count: candidates.length, before });
    return { deleted: candidates.length };
  });
}
