import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { configureQueue } from '../src/queues.js';
test('submissions persist exact JSON and deduplicate canonical requests across time', (t) => {
  const f = fixture(t),
    spec = { kind: 'resize', payload: { b: 2, a: 1 }, idempotencyKey: 'upload-1' };
  const a = submit(f.store, spec);
  f.advance(100);
  const b = submit(f.store, { ...spec, payload: { a: 1, b: 2 } });
  assert(b.deduplicated);
  assert.equal(a.job.id, b.job.id);
  assert.throws(
    () => submit(f.store, { ...spec, payload: { a: 3 } }),
    (e) => e.code === 'IDEMPOTENCY_CONFLICT',
  );
});
test('queue admission is atomic and malformed jobs create no queue', (t) => {
  const { store } = fixture(t);
  configureQueue(store, 'q', { maxPending: 1 });
  submit(store, { queue: 'q', kind: 'x' });
  assert.throws(
    () => submit(store, { queue: 'q', kind: 'x' }),
    (e) => e.status === 429,
  );
  assert.throws(() => submit(store, { queue: 'bad', kind: 'x', payload: { a: undefined } }));
  assert(!store.db.prepare("SELECT 1 FROM queues WHERE name='bad'").get());
});
