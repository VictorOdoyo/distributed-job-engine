import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {registerWorker,touchWorker,setWorkerStatus} from '../src/workers.js';
test('worker identities cannot collide and draining heartbeats retain their state',t=>{const f=fixture(t),w=registerWorker(f.store,{id:'w1',capacity:2,queues:['a','b']});assert.equal(w.capacity,2);assert.throws(()=>registerWorker(f.store,{id:'w1'}),e=>e.status===409);setWorkerStatus(f.store,'w1','draining');f.advance(500);assert.equal(touchWorker(f.store,'w1').status,'draining');setWorkerStatus(f.store,'w1','offline');assert.throws(()=>touchWorker(f.store,'w1'));});
