import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submitWorkflow } from '../src/workflow.js';
import { trace } from '../src/traces.js';
test('trace lookup connects all workflow nodes and their durable journal records', (t) => {
  const { store } = fixture(t),
    w = submitWorkflow(store, {
      nodes: [
        { key: 'a', job: { kind: 'a' } },
        { key: 'b', job: { kind: 'b' }, dependsOn: ['a'] },
      ],
    });
  const r = trace(store, w.traceId);
  assert.equal(r.jobs.length, 2);
  assert.equal(r.events.length, 2);
  assert(!r.truncated);
  assert.equal(trace(store, w.traceId, { limit: 1 }).truncated, true);
});
