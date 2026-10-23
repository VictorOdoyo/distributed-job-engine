import test from 'node:test';
import assert from 'node:assert/strict';

import { retryDelay, classifyFailure } from '../src/retry.js';
test('backoff is capped deterministic and bounded without global randomness', () => {
  assert.deepEqual(
    [1, 2, 3, 4].map((n) => retryDelay(n, { base: 100, cap: 500, jitter: false })),
    [100, 200, 400, 500],
  );
  for (let n = 1; n < 20; n++) {
    const d = retryDelay(n, { key: 'a' }),
      upper = Math.min(60000, 1000 * 2 ** (n - 1));
    assert(d >= upper / 2 && d < upper);
    assert.equal(d, retryDelay(n, { key: 'a' }));
  }
  assert.equal(classifyFailure({ message: 'x', retryable: false }).retryable, false);
});
