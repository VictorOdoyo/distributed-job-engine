import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {maintenance} from '../src/maintenance.js';import {acquireLock} from '../src/locks.js';import {createSchedule} from '../src/schedules.js';
test('maintenance coordinates recovery and scheduling while respecting a live peer lock',t=>{const f=fixture(t);createSchedule(f.store,{kind:'tick',intervalMs:1000});f.advance(1000);assert.equal(maintenance(f.store).fired,1);acquireLock(f.store,'maintenance','peer');assert.equal(maintenance(f.store).leader,false);f.advance(10000);assert.equal(maintenance(f.store).leader,true);});
