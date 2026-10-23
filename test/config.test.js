import test from 'node:test';
import assert from 'node:assert/strict';

import { serverConfig, workerConfig } from '../src/config.js';
test('server config requires authentication for public binds and worker flags remain bounded', () => {
  assert.equal(serverConfig([]).port, 4177);
  assert.throws(
    () => serverConfig(['--host', '0.0.0.0']),
    (e) => e.code === 'CONFIG',
  );
  assert.equal(
    serverConfig(['--host', '0.0.0.0'], { ENGINE_TOKEN: 'x'.repeat(32) }).host,
    '0.0.0.0',
  );
  assert.equal(workerConfig(['--queues', 'a,b', '--capacity', '2']).capacity, 2);
  assert.throws(() => workerConfig(['--capacity', '100']));
  assert.throws(() => serverConfig(['--typo']));
});
