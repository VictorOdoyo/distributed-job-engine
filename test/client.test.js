import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { createServer } from '../src/server.js';
import { Client } from '../src/client.js';
test('HTTP client completes a full remote worker lifecycle and preserves fenced errors', async (t) => {
  const { store } = fixture(t),
    server = createServer(store, { rateLimit: false });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((r) => server.close(r));
  });
  const c = new Client('http://127.0.0.1:' + server.address().port);
  const { job } = await c.submit({ kind: 'x' }),
    w = await c.register({ capacity: 1 }),
    j = await c.claim(w.id);
  assert.equal(j.id, job.id);
  await c.complete(j.id, j.lease_token, { done: true });
  assert.equal((await c.get(j.id)).job.result.done, true);
  await assert.rejects(c.complete(j.id, j.lease_token, null), (e) => e.code === 'LEASE_FENCED');
  await c.retire(w.id);
});
