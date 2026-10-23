import { name, text, record } from './validation.js';
import { encode } from './codec.js';
import { getJob } from './jobs.js';
import { requireThat } from './errors.js';
import { emit } from './events.js';
export function addNote(store, id, { author = 'operator', text: body } = {}) {
  name(author, 'Author');
  text(body, 'Note', 2000);
  requireThat(body.trim().length > 0, 'VALIDATION', 'Note cannot be empty');
  return store.tx((now) => {
    const j = getJob(store, id);
    requireThat(
      store.db.prepare('SELECT count(*) n FROM notes WHERE job_id=?').get(id).n < 100,
      'NOTE_LIMIT',
      'Job note limit reached',
      409,
    );
    const n = Number(
      store.db
        .prepare('INSERT INTO notes(job_id,author,text,created_at) VALUES(?,?,?,?)')
        .run(id, author, body, now).lastInsertRowid,
    );
    emit(store, now, 'job.annotated', j, { author, noteId: n });
    return store.db.prepare('SELECT * FROM notes WHERE id=?').get(n);
  });
}
export function listNotes(store, id) {
  getJob(store, id);
  return store.db.prepare('SELECT * FROM notes WHERE job_id=? ORDER BY id').all(id);
}
export function setTags(store, id, tags) {
  record(tags, 'tags');
  const json = encode(tags, 8192);
  return store.tx((now) => {
    const j = getJob(store, id);
    store.db.prepare('UPDATE jobs SET tags=?,updated_at=? WHERE id=?').run(json, now, id);
    emit(store, now, 'job.tags_updated', j);
    return getJob(store, id);
  });
}
