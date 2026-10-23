import test from 'node:test';
import assert from 'node:assert/strict';

import {matchRoute,numeric} from '../src/router.js';
test('routing decodes parameters while distinguishing missing paths from unsupported methods',()=>{const routes=[{method:'GET',path:'/api/jobs/:id'}];assert.equal(matchRoute(routes,'GET','/api/jobs/a%2Db').params.id,'a-b');assert.throws(()=>matchRoute(routes,'POST','/api/jobs/a'),e=>e.status===405);assert.throws(()=>matchRoute(routes,'GET','/api/missing'),e=>e.status===404);assert.throws(()=>numeric('1.5',0));});
