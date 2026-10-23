import test from 'node:test';
import assert from 'node:assert/strict';

import { fixture } from './helpers.js';
import { emit, listEvents } from '../src/events.js';
test('events commit with state and cursor pages never repeat committed records', (t) => {
  const { store } = fixture(t);
  store.tx((now) => {
    emit(store, now, 'job.created');
    emit(store, now, 'job.started');
  });
  assert.throws(() =>
    store.tx((now) => {
      emit(store, now, 'job.lost');
      throw Error();
    }),
  );
  const a = listEvents(store, { limit: 1 }),
    b = listEvents(store, { after: a.cursor });
  assert.equal(a.items[0].type, 'job.created');
  assert.equal(b.items[0].type, 'job.started');
  assert.equal(listEvents(store).items.length, 2);
});
