import test from 'node:test';
import assert from 'node:assert/strict';

import { DatabaseSync } from 'node:sqlite';
import { SCHEMA } from '../src/schema.js';
test('schema enforces running-lease invariants and referential integrity', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  db.exec(SCHEMA);
  assert.throws(() =>
    db
      .prepare(
        "INSERT INTO attempts(job_id,number,token,worker_id,started_at,status) VALUES('missing',1,'t','w',1,'running')",
      )
      .run(),
  );
  assert.throws(() =>
    db.prepare("INSERT INTO queues(name,concurrency,created_at) VALUES('x',0,1)").run(),
  );
  db.close();
});
