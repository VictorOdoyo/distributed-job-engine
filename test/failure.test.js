import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { fail } from '../src/failure.js';
test('transient failures retry after backoff and attempts exhaust into durable failure', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x', maxAttempts: 2, backoffBase: 100, backoffCap: 100 });
  const a = claim(f.store, 'w');
  const waiting = fail(f.store, a.id, a.lease_token, { message: 'transient' });
  assert.equal(waiting.state, 'waiting');
  assert(waiting.run_at > f.time);
  assert.equal(claim(f.store, 'w'), null);
  f.advance(100);
  const b = claim(f.store, 'w');
  assert.notEqual(a.lease_token, b.lease_token);
  assert.equal(fail(f.store, b.id, b.lease_token, { message: 'again' }).state, 'failed');
});
test('permanent handler failure bypasses remaining retries', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x' });
  const j = claim(f.store, 'w');
  assert.equal(
    fail(f.store, j.id, j.lease_token, { message: 'bad data', retryable: false }).state,
    'failed',
  );
});
