import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { heartbeat } from '../src/heartbeat.js';
test('heartbeats extend active ownership but never the hard handler deadline', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x', timeoutMs: 1500 });
  const j = claim(f.store, 'w', { leaseMs: 1000 });
  f.advance(500);
  assert.equal(
    heartbeat(f.store, j.id, j.lease_token, { leaseMs: 5000 }).lease_until,
    j.started_at + 1500,
  );
  f.advance(1000);
  assert.throws(() => heartbeat(f.store, j.id, j.lease_token));
});
