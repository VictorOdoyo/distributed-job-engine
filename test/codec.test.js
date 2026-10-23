import test from 'node:test';
import assert from 'node:assert/strict';

import { encode, decode, canonical } from '../src/codec.js';
test('payload encoding detects lossy types cycles depth and byte limits', () => {
  for (const value of [undefined, NaN, 1n, new Date(), { a: undefined }])
    assert.throws(() => encode(value));
  const a = {};
  a.self = a;
  assert.throws(() => encode(a));
  assert.throws(() => encode('é'.repeat(20), 30));
  assert.deepEqual(decode(encode({ a: [1, null, true] })), { a: [1, null, true] });
  assert.equal(canonical({ b: 2, a: { z: 1, c: 3 } }), canonical({ a: { c: 3, z: 1 }, b: 2 }));
});
