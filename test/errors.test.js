import test from 'node:test';
import assert from 'node:assert/strict';

import {EngineError,requireThat,normalizeError} from '../src/errors.js';
test('public error normalization hides internals while preserving actionable conflicts',()=>{assert.throws(()=>requireThat(false,'FENCED','Lease lost',409),e=>e instanceof EngineError&&e.status===409);assert.equal(normalizeError(new Error('/secret/path')).message,'Internal coordinator error');assert.equal(normalizeError(new Error('database is locked')).status,503);});
