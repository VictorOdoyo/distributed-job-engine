import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {history} from '../src/history.js';import {submit} from '../src/submit.js';
test('activity buckets include real journal events with explicit empty intervals',t=>{const f=fixture(t);f.setTime(120000);submit(f.store,{kind:'x'});f.advance(60000);submit(f.store,{kind:'y'});const h=history(f.store,{buckets:3});assert.deepEqual(h.points.map(p=>p.submitted),[0,1,1]);assert(h.points.every(p=>p.succeeded===0));});
