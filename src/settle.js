import { emit } from './events.js';
/** Must run inside the transition transaction. Cascades are bounded by admitted workflow size. */
export function settleDependencies(store, now) {
  let changed = 0;
  while (true) {
    const blocked = store.db
      .prepare("SELECT * FROM jobs WHERE state='blocked' ORDER BY created_at,id")
      .all();
    let pass = 0;
    for (const j of blocked) {
      const parents = store.db
        .prepare('SELECT j.state FROM dependencies d JOIN jobs j ON j.id=d.parent WHERE d.child=?')
        .all(j.id);
      if (!parents.length) continue;
      if (parents.some((p) => p.state === 'failed' || p.state === 'cancelled')) {
        store.db
          .prepare("UPDATE jobs SET state='cancelled',finished_at=?,updated_at=? WHERE id=?")
          .run(now, now, j.id);
        emit(store, now, 'job.dependency_cancelled', j);
        pass++;
      } else if (parents.every((p) => p.state === 'succeeded')) {
        store.db.prepare("UPDATE jobs SET state='waiting',updated_at=? WHERE id=?").run(now, j.id);
        emit(store, now, 'job.unblocked', j);
        pass++;
      }
    }
    changed += pass;
    if (!pass) break;
  }
  return changed;
}
