import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { submit } from '../src/submit.js';
import { addNote, listNotes, setTags } from '../src/annotations.js';
test('operator notes and bounded tags preserve job execution state', (t) => {
  const { store } = fixture(t),
    j = submit(store, { kind: 'x' }).job;
  addNote(store, j.id, { author: 'ops', text: 'Investigate upstream input' });
  assert.equal(listNotes(store, j.id)[0].author, 'ops');
  assert.equal(setTags(store, j.id, { team: 'media' }).state, 'waiting');
  assert.throws(() => addNote(store, j.id, { text: ' ' }));
  assert.throws(() => setTags(store, j.id, { bad: undefined }));
});
