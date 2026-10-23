import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  Store,
  submitBulk,
  registerWorker,
  claim,
  complete,
  statistics,
  integrity,
} from '../src/index.js';
const store = new Store();
try {
  const start = performance.now();
  for (let batch = 0; batch < 10; batch++)
    submitBulk(
      store,
      Array.from({ length: 100 }, (_, i) => ({
        queue: 'bench',
        kind: 'report.aggregate',
        payload: { values: [batch, i, 100] },
        priority: i % 5,
      })),
    );
  const admitted = performance.now();
  registerWorker(store, { id: 'benchmark', queues: ['bench'], capacity: 1 });
  let count = 0;
  while (true) {
    const j = claim(store, 'benchmark');
    if (!j) break;
    complete(store, j.id, j.lease_token, { ok: true });
    count++;
  }
  const end = performance.now(),
    stats = statistics(store);
  assert.equal(count, 1000);
  assert.equal(stats.states.succeeded, 1000);
  assert(integrity(store).ok);
  assert.equal(store.db.prepare('SELECT count(*) n FROM attempts').get().n, 1000);
  const report = {
    jobs: count,
    admissionMs: admitted - start,
    claimAndCompleteMs: end - admitted,
    totalMs: end - start,
    attempts: 1000,
    integrity: 'passed',
    storage: 'in-memory SQLite; timing is observational, not a disk throughput claim',
  };
  mkdirSync('results', { recursive: true });
  writeFileSync('results/benchmark.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  store.close();
}
