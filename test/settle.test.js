import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {settleDependencies} from '../src/settle.js';
test('dependency reconciliation is idempotent on empty durable state',t=>{const{store}=fixture(t);assert.equal(store.tx(now=>settleDependencies(store,now)),0);assert.equal(store.tx(now=>settleDependencies(store,now)),0);});
