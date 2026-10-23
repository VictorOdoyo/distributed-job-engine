import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {jobRoutes} from '../src/api-jobs.js';import {matchRoute} from '../src/router.js';
test('job command routes preserve validation and detailed audit responses',t=>{const{store}=fixture(t),routes=jobRoutes(store);const create=matchRoute(routes,'POST','/api/jobs').route.handler({body:{kind:'x'}});const id=create.job.id;const detail=matchRoute(routes,'GET','/api/jobs/'+id);assert.equal(detail.route.handler({params:detail.params}).events.length,1);const c=matchRoute(routes,'POST','/api/jobs/'+id+'/cancel');assert(c.route.handler({params:c.params}).changed);});
