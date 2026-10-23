import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { cancel } from '../src/cancel.js';
import { complete } from '../src/complete.js';
test('running cancellation fences the attempt and repeated cancel is idempotent', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x' });
  const j = claim(f.store, 'w');
  assert(cancel(f.store, j.id).changed);
  assert(!cancel(f.store, j.id).changed);
  assert.throws(() => complete(f.store, j.id, j.lease_token));
  assert.equal(f.store.db.prepare('SELECT status FROM attempts').get().status, 'cancelled');
});
