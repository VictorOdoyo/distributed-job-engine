import test from 'node:test';
import assert from 'node:assert/strict';

import { handle } from '../src/handlers.js';
test('built-in handlers produce real hashes aggregates normalized text and deterministic retry outcomes', async () => {
  assert.equal(
    (await handle({ kind: 'hash.batch', payload: { items: ['abc'] } })).result.hashes[0],
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
  assert.equal(
    (await handle({ kind: 'report.aggregate', payload: { values: [1, 2, 8, 9] } })).result.median,
    5,
  );
  assert.deepEqual(
    (await handle({ kind: 'text.normalize', payload: { items: [' A ', 'a', 'Ｂ'] } })).result.items,
    ['a', 'b'],
  );
  await assert.rejects(handle({ kind: 'flaky', attempts: 1, payload: { failures: 1 } }));
  assert.equal(
    (await handle({ kind: 'flaky', attempts: 2, payload: { failures: 1 } })).result
      .recoveredOnAttempt,
    2,
  );
});
test('sleep handler respects abort signals', async () => {
  const c = new AbortController(),
    p = handle({ kind: 'sleep', payload: { ms: 30000 } }, { signal: c.signal });
  c.abort();
  await assert.rejects(p, (e) => e.name === 'AbortError');
});
