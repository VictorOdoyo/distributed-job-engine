import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {submitWorkflow} from '../src/workflow.js';import {cancelWorkflow} from '../src/workflow-cancel.js';import {registerWorker} from '../src/workers.js';import {claim} from '../src/claim.js';import {complete} from '../src/complete.js';
test('workflow cancellation revokes running branches and all pending descendants atomically',t=>{const{store}=fixture(t);registerWorker(store,{id:'w'});const w=submitWorkflow(store,{nodes:[{key:'a',job:{kind:'a'}},{key:'b',job:{kind:'b'},dependsOn:['a']}]});const j=claim(store,'w');const r=cancelWorkflow(store,w.id);assert.equal(r.changed,2);assert(r.workflow.jobs.every(j=>j.state==='cancelled'));assert.throws(()=>complete(store,j.id,j.lease_token));assert.equal(cancelWorkflow(store,w.id).changed,0);});
