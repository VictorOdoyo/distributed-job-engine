import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {emit,listEvents} from '../src/events.js';import {tailEvents} from '../src/journal-tail.js';
test('journal tail starts at recent history and continues without gaps by cursor',t=>{const{store}=fixture(t);store.tx(now=>{for(let i=0;i<20;i++)emit(store,now,'job.test',null,{i});});const tail=tailEvents(store,{limit:5});assert.deepEqual(tail.items.map(e=>e.data.i),[15,16,17,18,19]);store.tx(now=>emit(store,now,'job.test',null,{i:20}));assert.equal(listEvents(store,{after:tail.cursor}).items[0].data.i,20);});
