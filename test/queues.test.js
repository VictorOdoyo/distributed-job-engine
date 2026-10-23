import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { configureQueue, listQueues } from '../src/queues.js';
test('queue configuration preserves unspecified settings and rejects unknown controls', (t) => {
  const { store } = fixture(t);
  configureQueue(store, 'images', { concurrency: 3, paused: true });
  const q = configureQueue(store, 'images', { rateLimit: 5 });
  assert.equal(q.concurrency, 3);
  assert.equal(q.paused, 1);
  assert.equal(q.rate_limit, 5);
  assert.equal(listQueues(store)[0].total, 0);
  assert.throws(() => configureQueue(store, 'images', { concurency: 4 }));
});
