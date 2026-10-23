import test from 'node:test';
import assert from 'node:assert/strict';

import {Store} from '../src/store.js';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
test('transactions rollback on errors and survive reopening with WAL durability',()=>{const dir=mkdtempSync(path.join(tmpdir(),'engine-store-')),file=path.join(dir,'engine.db');let s=new Store(file,{clock:()=>42});try{assert.throws(()=>s.tx(()=>{s.db.prepare("INSERT INTO queues(name,created_at) VALUES('lost',42)").run();throw new Error('boom');}));assert.equal(s.db.prepare('SELECT count(*) n FROM queues').get().n,0);s.tx(t=>s.db.prepare("INSERT INTO queues(name,created_at) VALUES('kept',?)").run(t));s.close();s=new Store(file);assert.equal(s.db.prepare('SELECT name FROM queues').get().name,'kept');assert.equal(s.db.prepare('PRAGMA journal_mode').get().journal_mode,'wal');}finally{s.close();rmSync(dir,{recursive:true,force:true});}});
test('nested and asynchronous transactions are rejected and rolled back',()=>{const s=new Store();try{assert.throws(()=>s.tx(()=>s.tx(()=>1)));assert.throws(()=>s.tx(()=>Promise.resolve()));assert.equal(s.tx(()=>7),7);}finally{s.close();}});
