import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { startMaintenance } from '../src/runtime.js';
import { createSchedule } from '../src/schedules.js';
test('maintenance service exposes failures and stops without leaving recurring work', (t) => {
  const f = fixture(t),
    r = startMaintenance(f.store, { intervalMs: 60000 });
  t.after(() => r.stop());
  createSchedule(f.store, { kind: 'x', intervalMs: 1000 });
  f.advance(1000);
  assert.equal(r.tick().fired, 1);
  assert.equal(r.status.lastTick, f.time);
  r.stop();
  assert.equal(r.tick(), undefined);
  assert(r.status.stopped);
});
