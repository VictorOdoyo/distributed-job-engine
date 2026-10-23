import { encode, decode } from './codec.js';
import { integer, name } from './validation.js';
export function emit(store, time, type, job = null, data = {}) {
  name(type, 'Event type');
  return Number(
    store.db
      .prepare('INSERT INTO events(time,type,job_id,queue,data) VALUES(?,?,?,?,?)')
      .run(time, type, job?.id ?? null, job?.queue ?? null, encode(data, 16384)).lastInsertRowid,
  );
}
export function listEvents(store, { after = 0, limit = 100, jobId } = {}) {
  integer(after, 'cursor');
  integer(limit, 'limit', 1, 500);
  const rows = jobId
    ? store.db
        .prepare('SELECT * FROM events WHERE id>? AND job_id=? ORDER BY id LIMIT ?')
        .all(after, jobId, limit)
    : store.db.prepare('SELECT * FROM events WHERE id>? ORDER BY id LIMIT ?').all(after, limit);
  return {
    items: rows.map((r) => ({ ...r, data: decode(r.data) })),
    cursor: rows.at(-1)?.id ?? after,
  };
}
