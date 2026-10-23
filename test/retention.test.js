import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {submit} from '../src/submit.js';import {cancel} from '../src/cancel.js';import {prune} from '../src/retention.js';
test('retention removes only eligible terminal jobs and preserves active deduplication',t=>{const f=fixture(t),a=submit(f.store,{kind:'x'}).job,b=submit(f.store,{kind:'x',idempotencyKey:'keep'}).job;cancel(f.store,a.id);cancel(f.store,b.id);f.advance(1000);assert.equal(prune(f.store,{before:f.time}).deleted,1);assert.equal(f.store.db.prepare('SELECT id FROM jobs').get().id,b.id);f.advance(86400000);assert.equal(prune(f.store,{before:f.time}).deleted,1);});
