import {normalizeSpec,submitIn} from './submit.js';import {requireThat} from './errors.js';
export function submitBulk(store,specs){requireThat(Array.isArray(specs)&&specs.length>0&&specs.length<=100,'VALIDATION','Bulk submission requires 1..100 jobs');specs.forEach(normalizeSpec);return store.tx(now=>specs.map(spec=>submitIn(store,spec,now)));}
