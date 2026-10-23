import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { reap } from '../src/reap.js';
import { complete } from '../src/complete.js';
test('expired attempts recover once and a late worker cannot overwrite recovery', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'a' });
  registerWorker(f.store, { id: 'b' });
  submit(f.store, { kind: 'x', backoffBase: 0, backoffCap: 0 });
  const a = claim(f.store, 'a', { leaseMs: 500 });
  f.advance(500);
  assert.equal(reap(f.store).recovered, 1);
  assert.equal(reap(f.store).recovered, 0);
  const b = claim(f.store, 'b');
  assert.equal(b.attempts, 2);
  assert.throws(
    () => complete(f.store, a.id, a.lease_token, 'stale'),
    (e) => e.status === 409,
  );
  assert.equal(complete(f.store, b.id, b.lease_token, 'fresh').result, 'fresh');
});
