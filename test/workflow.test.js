import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submitWorkflow, getWorkflow } from '../src/workflow.js';
import { registerWorker } from '../src/workers.js';
import { claim } from '../src/claim.js';
import { complete } from '../src/complete.js';
import { fail } from '../src/failure.js';
test('diamond workflows release joins only after every parent succeeds', (t) => {
  const { store } = fixture(t);
  registerWorker(store, { id: 'w' });
  const w = submitWorkflow(store, {
    nodes: [
      { key: 'a', job: { kind: 'a' } },
      { key: 'b', job: { kind: 'b' }, dependsOn: ['a'] },
      { key: 'c', job: { kind: 'c' }, dependsOn: ['a'] },
      { key: 'd', job: { kind: 'd' }, dependsOn: ['b', 'c'] },
    ],
  });
  assert.equal(w.jobs.d.state, 'blocked');
  for (let i = 0; i < 4; i++) {
    const j = claim(store, 'w');
    assert(j);
    complete(store, j.id, j.lease_token);
    if (i === 1)
      assert.equal(getWorkflow(store, w.id).jobs.find((j) => j.kind === 'd').state, 'blocked');
  }
  assert.equal(getWorkflow(store, w.id).state, 'succeeded');
});
test('cycles reject atomically and terminal parent failure cancels descendants', (t) => {
  const { store } = fixture(t);
  assert.throws(() =>
    submitWorkflow(store, {
      nodes: [
        { key: 'a', job: { kind: 'x' }, dependsOn: ['b'] },
        { key: 'b', job: { kind: 'x' }, dependsOn: ['a'] },
      ],
    }),
  );
  assert.equal(store.db.prepare('SELECT count(*) n FROM workflows').get().n, 0);
  registerWorker(store, { id: 'w' });
  const w = submitWorkflow(store, {
    nodes: [
      { key: 'a', job: { kind: 'x' } },
      { key: 'b', job: { kind: 'y' }, dependsOn: ['a'] },
      { key: 'c', job: { kind: 'z' }, dependsOn: ['b'] },
    ],
  });
  const j = claim(store, 'w');
  fail(store, j.id, j.lease_token, { retryable: false });
  assert.equal(getWorkflow(store, w.id).jobs.filter((j) => j.state === 'cancelled').length, 2);
});
