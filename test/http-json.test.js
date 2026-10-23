import test from 'node:test';
import assert from 'node:assert/strict';

import {PassThrough} from 'node:stream';import {readJSON} from '../src/http-json.js';
test('HTTP JSON parser rejects incorrect media types invalid JSON and streaming overflow',async()=>{const req=()=>{const s=new PassThrough();s.headers={'content-type':'application/json'};return s;};const a=req(),p=readJSON(a);a.end('{"n":2}');assert.deepEqual(await p,{n:2});const b=req(),q=readJSON(b);b.end('bad');await assert.rejects(q,e=>e.status===400);const c=req(),r=readJSON(c,{limit:10});c.end('"'+'x'.repeat(20)+'"');await assert.rejects(r,e=>e.status===413);const d=req();d.headers={};assert.throws(()=>readJSON(d),e=>e.status===415);});
