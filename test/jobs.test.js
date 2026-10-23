import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {getJob,listJobs} from '../src/jobs.js';
test('job lookup distinguishes missing jobs and bounded cursor queries',t=>{const{store}=fixture(t);assert.throws(()=>getJob(store,'missing'),e=>e.status===404);assert.deepEqual(listJobs(store).items,[]);assert.throws(()=>listJobs(store,{limit:100000}));assert.throws(()=>listJobs(store,{typo:'x'}));});
