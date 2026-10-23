import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {operationRoutes} from '../src/api-operations.js';import {matchRoute} from '../src/router.js';
test('operations routes expose real durable queue and fleet state',t=>{const{store}=fixture(t),routes=operationRoutes(store),run=(method,path,body)=>{const r=matchRoute(routes,method,path);return r.route.handler({params:r.params,body,query:new URLSearchParams()});};run('PUT','/api/queues/media',{concurrency:2});run('POST','/api/workers',{id:'remote',queues:['media']});assert.equal(run('GET','/api/overview').workers,1);assert.equal(run('GET','/api/queues').items[0].concurrency,2);assert(run('GET','/api/integrity').ok);});
