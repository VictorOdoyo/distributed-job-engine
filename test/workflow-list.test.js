import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {submitWorkflow} from '../src/workflow.js';import {listWorkflows} from '../src/workflow-list.js';import {cancelWorkflow} from '../src/workflow-cancel.js';
test('workflow summaries count graph state without loading node payloads',t=>{const{store}=fixture(t),w=submitWorkflow(store,{nodes:[{key:'a',job:{kind:'sleep'}}]});assert.equal(listWorkflows(store)[0].state,'running');cancelWorkflow(store,w.id);assert.equal(listWorkflows(store)[0].cancelled,1);assert.equal(listWorkflows(store)[0].state,'cancelled');});
