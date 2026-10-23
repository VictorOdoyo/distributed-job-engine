import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { reschedule } from '../src/reschedule.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
test('rescheduling changes due time without disturbing other pending metadata', (t) => {
  const f = fixture(t),
    j = submit(f.store, { kind: 'x', priority: 3 }).job;
  const r = reschedule(f.store, j.id, { runAt: f.time + 5000 });
  assert.equal(r.priority, 3);
  registerWorker(f.store, { id: 'w' });
  assert.equal(claim(f.store, 'w'), null);
  f.advance(5000);
  const active = claim(f.store, 'w');
  assert.equal(active.id, j.id);
  assert.throws(
    () => reschedule(f.store, j.id, { priority: 5 }),
    (e) => e.status === 409,
  );
});
