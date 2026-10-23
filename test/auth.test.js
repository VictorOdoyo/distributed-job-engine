import test from 'node:test';
import assert from 'node:assert/strict';

import {authorize,checkOrigin,validateToken} from '../src/auth.js';
test('bearer authentication and origin checks reject untrusted browser mutations',()=>{const token='x'.repeat(32);authorize({headers:{authorization:'Bearer '+token}},token);assert.throws(()=>authorize({headers:{authorization:'Bearer wrong'}},token),e=>e.status===401);checkOrigin({headers:{origin:'http://localhost:4177',host:'localhost:4177'}});assert.throws(()=>checkOrigin({headers:{origin:'https://elsewhere.test',host:'localhost:4177'}}),e=>e.status===403);assert.throws(()=>validateToken('short'));});
