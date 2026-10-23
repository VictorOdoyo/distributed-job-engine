import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { complete } from '../src/complete.js';
import { claimEffect, acknowledgeEffect, retryEffect } from '../src/outbox.js';
test('outbox effects retry independently and stale deliveries cannot acknowledge reclaimed work', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x' });
  const j = claim(f.store, 'w');
  complete(f.store, j.id, j.lease_token, null, {
    effects: [{ topic: 'email.send', payload: { to: 'local' } }],
  });
  const a = claimEffect(f.store, { leaseMs: 100 });
  f.advance(100);
  const b = claimEffect(f.store);
  assert.equal(a.id, b.id);
  assert.notEqual(a.token, b.token);
  assert.throws(() => acknowledgeEffect(f.store, a.id, a.token));
  retryEffect(f.store, b.id, b.token);
  const c = claimEffect(f.store);
  assert.equal(c.attempts, 3);
  acknowledgeEffect(f.store, c.id, c.token);
  assert.equal(claimEffect(f.store), null);
});
