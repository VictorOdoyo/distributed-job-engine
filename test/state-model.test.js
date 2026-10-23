import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './helpers.js';
import {
  submit,
  registerWorker,
  claim,
  complete,
  fail,
  cancel,
  heartbeat,
  reap,
  integrity,
} from '../src/index.js';
test('randomized lifecycle commands preserve independent durable ownership invariants', (t) => {
  const f = fixture(t);
  let seed = 92;
  const rng = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 3; i++) registerWorker(f.store, { id: 'w' + i, capacity: 4, ttlMs: 300000 });
  for (let step = 0; step < 700; step++) {
    f.advance(Math.floor(rng() * 30));
    const all = f.store.db.prepare('SELECT id,state,lease_token FROM jobs').all(),
      running = all.filter((j) => j.state === 'running'),
      j = running[Math.floor(rng() * running.length)],
      action = Math.floor(rng() * 7);
    try {
      if (action === 0 || !all.length)
        submit(f.store, { kind: 'x', maxAttempts: 3, backoffBase: 0, backoffCap: 0 });
      else if (action === 1) claim(f.store, 'w' + Math.floor(rng() * 3), { leaseMs: 300 });
      else if (action === 2 && j) complete(f.store, j.id, j.lease_token, { ok: true });
      else if (action === 3 && j) fail(f.store, j.id, j.lease_token, { message: 'random fault' });
      else if (action === 4) cancel(f.store, all[Math.floor(rng() * all.length)].id);
      else if (action === 5 && j) heartbeat(f.store, j.id, j.lease_token, { leaseMs: 300 });
      else reap(f.store);
    } catch (e) {
      assert.equal(e.code, 'LEASE_FENCED');
    }
    assert(integrity(f.store).ok);
    const bad = f.store.db
      .prepare(
        "SELECT a.job_id FROM attempts a JOIN jobs j ON j.id=a.job_id WHERE a.status='running' AND (j.state!='running' OR j.lease_token!=a.token)",
      )
      .all();
    assert.equal(bad.length, 0);
    assert.equal(
      f.store.db.prepare('SELECT count(*) n FROM jobs WHERE attempts>max_attempts').get().n,
      0,
    );
  }
});
