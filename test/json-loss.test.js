import test from 'node:test';
import assert from 'node:assert/strict';
import { encode } from '../src/codec.js';
test('payloads reject sparse arrays custom array properties and symbol-key loss', () => {
  assert.throws(() => encode([, 1]));
  const a = [1];
  a.extra = 2;
  assert.throws(() => encode(a));
  assert.throws(() => encode({ [Symbol('x')]: 1 }));
  assert.equal(encode([null, 1]), '[null,1]');
});
