import { submit } from './submit.js';
import { submitBulk } from './bulk.js';
import { getJob, attempts } from './jobs.js';
import { searchJobs } from './search-jobs.js';
import { cancel } from './cancel.js';
import { replay, replayBatch } from './replay.js';
import { reschedule } from './reschedule.js';
import { heartbeat } from './heartbeat.js';
import { complete } from './complete.js';
import { fail } from './failure.js';
import { addNote, listNotes, setTags } from './annotations.js';
import { listEvents } from './events.js';
import { fields } from './validation.js';
import { numeric } from './router.js';
export function jobRoutes(store) {
  return [
    {
      method: 'GET',
      path: '/api/jobs',
      handler: ({ query: q }) => ({
        items: searchJobs(store, {
          query: q.get('q') ?? undefined,
          queue: q.get('queue') ?? undefined,
          state: q.get('state') ?? undefined,
          traceId: q.get('traceId') ?? undefined,
          limit: numeric(q.get('limit'), 100),
        }),
      }),
    },
    { method: 'POST', path: '/api/jobs', status: 201, handler: ({ body }) => submit(store, body) },
    {
      method: 'POST',
      path: '/api/jobs/bulk',
      status: 201,
      handler: ({ body }) => {
        fields(body, ['jobs']);
        return submitBulk(store, body.jobs);
      },
    },
    {
      method: 'POST',
      path: '/api/jobs/replay-batch',
      handler: ({ body }) => {
        fields(body, ['ids']);
        return replayBatch(store, body.ids);
      },
    },
    {
      method: 'GET',
      path: '/api/jobs/:id',
      handler: ({ params: p }) => ({
        job: getJob(store, p.id),
        attempts: attempts(store, p.id),
        notes: listNotes(store, p.id),
        events: listEvents(store, { jobId: p.id, limit: 100 }).items,
      }),
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/cancel',
      handler: ({ params: p }) => cancel(store, p.id),
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/replay',
      handler: ({ params: p }) => replay(store, p.id),
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/reschedule',
      handler: ({ params: p, body }) => reschedule(store, p.id, body),
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/heartbeat',
      handler: ({ params: p, body }) => {
        fields(body, ['token', 'leaseMs']);
        return heartbeat(store, p.id, body.token, { leaseMs: body.leaseMs });
      },
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/complete',
      handler: ({ params: p, body }) => {
        fields(body, ['token', 'result', 'effects']);
        return complete(store, p.id, body.token, body.result ?? null, { effects: body.effects });
      },
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/fail',
      handler: ({ params: p, body }) => {
        fields(body, ['token', 'error']);
        return fail(store, p.id, body.token, body.error);
      },
    },
    {
      method: 'POST',
      path: '/api/jobs/:id/notes',
      status: 201,
      handler: ({ params: p, body }) => addNote(store, p.id, body),
    },
    {
      method: 'PUT',
      path: '/api/jobs/:id/tags',
      handler: ({ params: p, body }) => setTags(store, p.id, body),
    },
  ];
}
