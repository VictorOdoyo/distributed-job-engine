import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { registerWorker } from '../src/workers.js';
import { submit } from '../src/submit.js';
import { claim } from '../src/claim.js';
import { retireWorker, listWorkers } from '../src/fleet.js';
import { complete } from '../src/complete.js';
test('worker retirement releases owned attempts immediately and fences late results', (t) => {
  const f = fixture(t);
  registerWorker(f.store, { id: 'w' });
  submit(f.store, { kind: 'x' });
  const j = claim(f.store, 'w');
  assert.equal(listWorkers(f.store)[0].active, 1);
  assert.equal(retireWorker(f.store, 'w').released, 1);
  assert.equal(listWorkers(f.store)[0].live, false);
  assert.throws(() => complete(f.store, j.id, j.lease_token));
});
