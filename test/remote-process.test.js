import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { fixture } from './helpers.js';
import { createServer, submit, getJob } from '../src/index.js';
test('standalone worker CLI executes jobs in separate remote processes over HTTP', async (t) => {
  const { store } = fixture(t),
    server = createServer(store, { rateLimit: false });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((r) => server.close(r));
  });
  const jobs = Array.from(
      { length: 10 },
      () => submit(store, { kind: 'report.aggregate', payload: { values: [3, 6, 9] } }).job,
    ),
    url = 'http://127.0.0.1:' + server.address().port,
    script = fileURLToPath(new URL('../scripts/worker.mjs', import.meta.url)),
    exec = promisify(execFile);
  const results = await Promise.all([
    exec(process.execPath, [script, '--url', url, '--capacity', '2', '--max-jobs', '5'], {
      timeout: 20000,
    }),
    exec(process.execPath, [script, '--url', url, '--capacity', '2', '--max-jobs', '5'], {
      timeout: 20000,
    }),
  ]);
  for (const r of results) {
    const last = JSON.parse(r.stdout.trim().split('\n').at(-1));
    assert.equal(last.succeeded, 5);
  }
  assert(jobs.every((j) => getJob(store, j.id).result.mean === 6));
  assert.equal(store.db.prepare('SELECT count(*) n FROM attempts').get().n, 10);
});
