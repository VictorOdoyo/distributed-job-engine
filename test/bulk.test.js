import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submitBulk } from '../src/bulk.js';
import { configureQueue } from '../src/queues.js';
test('bulk submission rolls the entire batch back when admission fails', (t) => {
  const { store } = fixture(t);
  configureQueue(store, 'q', { maxPending: 2 });
  assert.throws(() =>
    submitBulk(
      store,
      Array.from({ length: 3 }, () => ({ queue: 'q', kind: 'x' })),
    ),
  );
  assert.equal(store.db.prepare('SELECT count(*) n FROM jobs').get().n, 0);
  assert.equal(
    submitBulk(store, [
      { queue: 'q', kind: 'x' },
      { queue: 'q', kind: 'y' },
    ]).length,
    2,
  );
});
