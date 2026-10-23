import test from 'node:test';
import assert from 'node:assert/strict';

import {integer,name,record,fields} from '../src/validation.js';
test('contracts reject ambiguous identifiers unsafe integers and unknown options',()=>{assert.equal(name('image.resize-v2'),'image.resize-v2');for(const n of['../jobs','a b','', 'a'.repeat(65)])assert.throws(()=>name(n));for(const v of[NaN,Infinity,1.2,2**54])assert.throws(()=>integer(v,'count'));assert.throws(()=>record([]));assert.throws(()=>fields({typo:1},['queue']));});
