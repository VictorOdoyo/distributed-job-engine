import test from 'node:test';
import assert from 'node:assert/strict';

import {fixture} from './helpers.js';import {backup,integrity} from '../src/backup.js';import {submit} from '../src/submit.js';import {Store} from '../src/store.js';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
test('online backups capture committed state and reopen with intact constraints',t=>{const{store}=fixture(t),dir=mkdtempSync(path.join(tmpdir(),'engine-backup-')),file=path.join(dir,'copy.db');try{const j=submit(store,{kind:'x',payload:{n:4}}).job;backup(store,file);assert.throws(()=>backup(store,file));const copy=new Store(file);try{assert.equal(copy.db.prepare('SELECT id FROM jobs').get().id,j.id);assert(integrity(copy).ok);}finally{copy.close();}}finally{rmSync(dir,{recursive:true,force:true});}});
