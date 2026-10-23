import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { acquireLock, renewLock, releaseLock } from '../src/locks.js';
test('coordinator locks fence stale owners and keep monotone epochs across release', (t) => {
  const f = fixture(t),
    a = acquireLock(f.store, 'scheduler', 'a', { ttlMs: 500 });
  assert.equal(acquireLock(f.store, 'scheduler', 'b'), null);
  f.advance(500);
  const b = acquireLock(f.store, 'scheduler', 'b');
  assert.equal(b.epoch, 2);
  assert.throws(() => renewLock(f.store, 'scheduler', a.token));
  releaseLock(f.store, 'scheduler', b.token);
  assert.equal(acquireLock(f.store, 'scheduler', 'c').epoch, 3);
});
