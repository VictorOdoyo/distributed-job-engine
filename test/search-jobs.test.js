import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {submit} from '../src/submit.js';import {searchJobs} from '../src/search-jobs.js';
test('operator search filters metadata and treats SQL wildcard input literally',t=>{const{store}=fixture(t);submit(store,{kind:'image.resize',tags:{team:'media'}});submit(store,{kind:'report.run',tags:{team:'finance'}});assert.equal(searchJobs(store,{query:'image',tag:{key:'team',value:'media'}}).length,1);assert.equal(searchJobs(store,{query:'%'}).length,0);assert.equal(searchJobs(store,{query:"' OR 1=1 --"}).length,0);assert.throws(()=>searchJobs(store,{state:'invented'}));});
