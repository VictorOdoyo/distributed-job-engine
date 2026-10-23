import { integer } from './validation.js';
import { decode } from './codec.js';
export function tailEvents(store, { limit = 100 } = {}) {
  integer(limit, 'limit', 1, 500);
  const rows = store.db
    .prepare('SELECT * FROM events ORDER BY id DESC LIMIT ?')
    .all(limit)
    .reverse();
  return { items: rows.map((r) => ({ ...r, data: decode(r.data) })), cursor: rows.at(-1)?.id ?? 0 };
}
