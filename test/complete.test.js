import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {submit} from '../src/submit.js';import {registerWorker} from '../src/workers.js';import {claim} from '../src/claim.js';import {complete} from '../src/complete.js';
test('success and outbox effects commit together and duplicate completions are fenced',t=>{const f=fixture(t);registerWorker(f.store,{id:'w'});submit(f.store,{kind:'x'});const j=claim(f.store,'w');const done=complete(f.store,j.id,j.lease_token,{bytes:12},{effects:[{topic:'image.ready',payload:{ok:true}}]});assert.equal(done.state,'succeeded');assert.equal(done.lease_token,null);assert.deepEqual(done.result,{bytes:12});assert.equal(f.store.db.prepare('SELECT count(*) n FROM outbox').get().n,1);assert.throws(()=>complete(f.store,j.id,j.lease_token));});
