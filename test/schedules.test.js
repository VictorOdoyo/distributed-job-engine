import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {createSchedule,fireSchedules,getSchedule,setSchedulePaused} from '../src/schedules.js';
test('schedule ticks are durable idempotent and skip missed slots without flooding',t=>{const f=fixture(t),s=createSchedule(f.store,{kind:'report',intervalMs:1000});assert.equal(fireSchedules(f.store).fired,0);f.advance(5500);assert.equal(fireSchedules(f.store).fired,1);assert.equal(fireSchedules(f.store).fired,0);assert.equal(getSchedule(f.store,s.id).next_at,f.time+500);setSchedulePaused(f.store,s.id,true);f.advance(1000);assert.equal(fireSchedules(f.store).fired,0);});
test('catch-up schedules retain bounded remaining backlog across ticks',t=>{const f=fixture(t),s=createSchedule(f.store,{kind:'tick',intervalMs:1000,catchUp:true});f.advance(5000);assert.equal(fireSchedules(f.store,{catchUpLimit:2}).fired,2);assert.equal(fireSchedules(f.store,{catchUpLimit:2}).fired,2);assert.equal(fireSchedules(f.store,{catchUpLimit:2}).fired,1);assert.equal(f.store.db.prepare('SELECT count(*) n FROM schedule_runs WHERE schedule_id=?').get(s.id).n,5);});
