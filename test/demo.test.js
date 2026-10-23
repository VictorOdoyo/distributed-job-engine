import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {seedDemo} from '../src/demo.js';
test('demo populates real durable jobs workflows and schedules without repeating on restart',t=>{const{store}=fixture(t);assert(seedDemo(store).seeded);const n=store.db.prepare('SELECT count(*) n FROM jobs').get().n;assert(n>=15);assert.equal(seedDemo(store).seeded,false);assert.equal(store.db.prepare('SELECT count(*) n FROM jobs').get().n,n);assert.equal(store.db.prepare('SELECT count(*) n FROM schedules').get().n,1);});
