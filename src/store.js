import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SCHEMA, VERSION } from './schema.js';
import { EngineError, normalizeError, requireThat } from './errors.js';
import { integer } from './validation.js';
export class Store {
  constructor(filename = ':memory:', { clock = Date.now, timeout = 1500 } = {}) {
    integer(timeout, 'SQLite timeout', 0, 10000);
    if (filename !== ':memory:')
      mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    this.db = new DatabaseSync(filename, { timeout });
    this.clock = clock;
    this.closed = false;
    this.transaction = false;
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
    const current = this.db.prepare('PRAGMA user_version').get().user_version;
    if (current > VERSION) {
      this.db.close();
      throw new EngineError('SCHEMA_VERSION', 'Database was created by a newer engine', 500);
    }
    if (current === 0) {
      this.db.exec('BEGIN IMMEDIATE');
      try {
        const inside = this.db.prepare('PRAGMA user_version').get().user_version;
        if (inside === 0) this.db.exec(SCHEMA + 'PRAGMA user_version=' + VERSION + ';');
        this.db.exec('COMMIT');
      } catch (e) {
        this.db.exec('ROLLBACK');
        this.db.close();
        throw e;
      }
    }
  }
  now() {
    return integer(this.clock(), 'Clock milliseconds', 0);
  }
  tx(fn) {
    requireThat(
      !this.closed && !this.transaction,
      'STORE_STATE',
      'Store closed or nested transaction',
      500,
    );
    try {
      this.db.exec('BEGIN IMMEDIATE');
      this.transaction = true;
      const result = fn(this.now());
      requireThat(
        !result || typeof result.then !== 'function',
        'STORE_STATE',
        'Transactions must be synchronous',
        500,
      );
      this.db.exec('COMMIT');
      return result;
    } catch (e) {
      if (this.transaction) this.db.exec('ROLLBACK');
      throw e instanceof EngineError ? e : normalizeError(e);
    } finally {
      this.transaction = false;
    }
  }
  close() {
    if (!this.closed) {
      this.db.close();
      this.closed = true;
    }
  }
}
