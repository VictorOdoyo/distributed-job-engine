import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {statistics,percentile} from '../src/statistics.js';import {submit} from '../src/submit.js';import {registerWorker} from '../src/workers.js';import {claim} from '../src/claim.js';import {complete} from '../src/complete.js';
test('statistics measure real backlog age and successful attempt latency',t=>{const f=fixture(t);registerWorker(f.store,{id:'w'});submit(f.store,{kind:'x'});submit(f.store,{kind:'y'});f.advance(500);const j=claim(f.store,'w');f.advance(200);complete(f.store,j.id,j.lease_token);const s=statistics(f.store);assert.equal(s.states.succeeded,1);assert.equal(s.readyLagMs,700);assert.equal(s.latency.p95,200);assert.equal(percentile([1,9,3,6],.5),3);});
