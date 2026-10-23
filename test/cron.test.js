import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCron, nextCron } from '../src/cron.js';
test('UTC cron handles ranges steps month boundaries leap days and DOM/DOW OR', () => {
  assert.equal(
    new Date(nextCron('*/15 9-17 * * 1-5', Date.UTC(2026, 9, 23, 17, 59))).toISOString(),
    '2026-10-26T09:00:00.000Z',
  );
  assert.equal(
    new Date(nextCron('0 0 29 2 *', Date.UTC(2025, 2, 1))).toISOString(),
    '2028-02-29T00:00:00.000Z',
  );
  assert.equal(
    new Date(nextCron('0 0 1 * 1', Date.UTC(2026, 9, 23))).toISOString(),
    '2026-10-26T00:00:00.000Z',
  );
  for (const expr of ['* * * *', '61 * * * *', '*/0 * * * *', '* * * * SUN'])
    assert.throws(() => parseCron(expr));
});
