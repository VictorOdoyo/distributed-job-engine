import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { cancel } from '../src/cancel.js';
import { replay, replayBatch } from '../src/replay.js';
test('dead-letter replay creates a fresh attempt lineage and preserves the original', (t) => {
  const { store } = fixture(t),
    j = submit(store, { kind: 'x', payload: { n: 7 } }).job;
  cancel(store, j.id);
  const r = replay(store, j.id);
  assert.notEqual(r.id, j.id);
  assert.equal(r.attempts, 0);
  assert.equal(r.replayed_from, j.id);
  assert.equal(r.trace_id, j.trace_id);
  assert.equal(store.db.prepare('SELECT state FROM jobs WHERE id=?').get(j.id).state, 'cancelled');
  assert.throws(() => replayBatch(store, [j.id, r.id]));
  assert.equal(store.db.prepare('SELECT count(*) n FROM jobs').get().n, 2);
});
