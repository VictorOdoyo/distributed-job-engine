import {name} from './validation.js';import {requireThat} from './errors.js';import {getJob} from './jobs.js';
export function leasedJob(store,id,token,now){name(token,'Lease token');const job=getJob(store,id);requireThat(job.state==='running'&&job.lease_token===token&&job.lease_until>now&&job.started_at+job.timeout_ms>now,'LEASE_FENCED','Lease is expired or no longer owns this attempt',409);return job;}
export const CLEAR_LEASE='lease_owner=NULL,lease_token=NULL,lease_until=NULL';
