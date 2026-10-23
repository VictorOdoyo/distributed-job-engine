import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { leasedJob } from '../src/fencing.js';
test('lease ownership fails on wrong token and at the exact expiry boundary', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x' });
  const j = claim(f.store, 'w', { leaseMs: 1000 });
  assert.equal(leasedJob(f.store, j.id, j.lease_token, f.time).id, j.id);
  assert.throws(
    () => leasedJob(f.store, j.id, 'wrong', f.time),
    (e) => e.code === 'LEASE_FENCED',
  );
  f.advance(1000);
  assert.throws(() => leasedJob(f.store, j.id, j.lease_token, f.time));
});
