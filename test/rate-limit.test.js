import test from 'node:test';
import assert from 'node:assert/strict';

import { RateLimiter } from '../src/rate-limit.js';
test('request token buckets refill without allocating unbounded client state', () => {
  let time = 0;
  const r = new RateLimiter({ capacity: 2, perSecond: 1, maxClients: 2, clock: () => time });
  assert(r.allow('a'));
  assert(r.allow('a'));
  assert(!r.allow('a'));
  time = 1000;
  assert(r.allow('a'));
  r.allow('b');
  r.allow('c');
  assert.equal(r.clients.size, 2);
});
