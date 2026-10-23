import test from 'node:test';
import assert from 'node:assert/strict';

import {runIsolated} from '../src/isolation.js';
test('isolated execution returns actual handler results and enforces parent-side timeouts',async()=>{const r=await runIsolated({kind:'report.aggregate',payload:{values:[2,4,6]}},{timeoutMs:3000});assert.equal(r.result.mean,4);await assert.rejects(runIsolated({kind:'sleep',payload:{ms:10000}},{timeoutMs:100}),e=>e.code==='HANDLER_TIMEOUT');});
test('cancellation terminates an isolated running task',async()=>{const c=new AbortController(),p=runIsolated({kind:'sleep',payload:{ms:10000}},{signal:c.signal,timeoutMs:30000});c.abort(new Error('Lease lost'));await assert.rejects(p,/Lease lost/);});
