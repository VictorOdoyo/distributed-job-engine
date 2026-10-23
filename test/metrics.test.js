import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {prometheus} from '../src/metrics.js';import {submit} from '../src/submit.js';
test('Prometheus metrics expose explicit zeroes and valid state labels',t=>{const{store}=fixture(t);submit(store,{kind:'x'});const text=prometheus(store);assert(text.includes('engine_jobs{state="waiting"} 1'));assert(text.includes('engine_jobs{state="running"} 0'));assert(text.includes('engine_attempt_duration_seconds_bucket{le="+Inf"} 0'));assert(text.endsWith('\n'));});
