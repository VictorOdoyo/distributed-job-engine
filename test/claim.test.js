import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {submit} from '../src/submit.js';import {registerWorker} from '../src/workers.js';import {claim} from '../src/claim.js';import {configureQueue} from '../src/queues.js';
test('claims enforce due time priority worker capacity and queue concurrency',t=>{const f=fixture(t);configureQueue(f.store,'default',{concurrency:1});registerWorker(f.store,{id:'a',capacity:3});registerWorker(f.store,{id:'b'});submit(f.store,{kind:'x',priority:5,runAt:f.time+1000});submit(f.store,{kind:'x',priority:1});const high=submit(f.store,{kind:'x',priority:3});assert.equal(claim(f.store,'a').id,high.job.id);assert.equal(claim(f.store,'b'),null);assert.equal(claim(f.store,'a'),null);});
test('paused queues and fixed-window rate limits prevent claims',t=>{const f=fixture(t);configureQueue(f.store,'default',{rateLimit:1,rateWindowMs:1000,concurrency:10});registerWorker(f.store,{id:'a'});submit(f.store,{kind:'x'});submit(f.store,{kind:'x'});assert(claim(f.store,'a'));assert.equal(claim(f.store,'a'),null);f.advance(1000);assert(claim(f.store,'a'));});
