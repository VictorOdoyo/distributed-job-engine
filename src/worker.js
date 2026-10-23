import { setTimeout as delay } from 'node:timers/promises';
import { integer } from './validation.js';
import { runIsolated } from './isolation.js';
import { classifyFailure } from './retry.js';
export async function runWorker(
  client,
  {
    queues = ['default'],
    capacity = 4,
    pollMs = 250,
    leaseMs = 10000,
    graceMs = 5000,
    maxJobs = Infinity,
    signal,
    moduleURL,
    onEvent = () => {},
  } = {},
) {
  integer(capacity, 'capacity', 1, 32);
  integer(pollMs, 'pollMs', 20, 30000);
  integer(leaseMs, 'leaseMs', 300, 60000);
  integer(graceMs, 'graceMs', 0, 300000);
  if (maxJobs !== Infinity) integer(maxJobs, 'maxJobs', 1, 1000000);
  const w = await client.register({
      queues,
      capacity,
      metadata: { runtime: 'node', isolated: true },
    }),
    active = new Map(),
    counts = { workerId: w.id, started: 0, succeeded: 0, failed: 0, lost: 0 };
  let lastTouch = performance.now();
  const log = (event) => {
    try {
      onEvent(event);
    } catch {}
  };
  async function execute(job, controller) {
    let lost = false,
      finished = false,
      timer;
    const renew = () => {
      if (finished) return;
      timer = setTimeout(
        async () => {
          try {
            await client.heartbeat(job.id, job.lease_token, { leaseMs });
            if (!finished) renew();
          } catch (error) {
            lost = true;
            controller.abort(error);
          }
        },
        Math.max(50, Math.floor(leaseMs / 3)),
      );
    };
    renew();
    try {
      log({ type: 'started', jobId: job.id, kind: job.kind, attempt: job.attempts });
      const value = await runIsolated(job, {
        signal: controller.signal,
        timeoutMs: job.timeout_ms,
        moduleURL,
      });
      if (lost) return;
      await client.complete(job.id, job.lease_token, value?.result ?? null, {
        effects: value?.effects ?? [],
      });
      counts.succeeded++;
      log({ type: 'succeeded', jobId: job.id });
    } catch (error) {
      if (lost) {
        counts.lost++;
        log({ type: 'lease_lost', jobId: job.id });
        return;
      }
      try {
        await client.fail(job.id, job.lease_token, classifyFailure(error));
        counts.failed++;
        log({ type: 'failed', jobId: job.id, message: error.message });
      } catch (reportError) {
        counts.lost++;
        log({ type: 'report_failed', jobId: job.id, message: reportError.message });
      }
    } finally {
      finished = true;
      clearTimeout(timer);
      active.delete(job.id);
    }
  }
  try {
    while (!signal?.aborted && counts.started < maxJobs) {
      try {
        if (performance.now() - lastTouch > 5000) {
          await client.touch(w.id);
          lastTouch = performance.now();
        }
        while (active.size < capacity && counts.started < maxJobs && !signal?.aborted) {
          const job = await client.claim(w.id, { leaseMs });
          if (!job) break;
          counts.started++;
          const controller = new AbortController(),
            entry = { controller, promise: null };
          active.set(job.id, entry);
          entry.promise = execute(job, controller);
        }
        if (counts.started >= maxJobs) break;
        await delay(pollMs, undefined, { signal });
      } catch (error) {
        if (signal?.aborted) break;
        log({ type: 'coordinator_error', message: error.message });
        await delay(Math.min(1000, pollMs * 2));
      }
    }
  } finally {
    let timer;
    await Promise.race([
      Promise.allSettled([...active.values()].map((e) => e.promise)),
      new Promise((r) => {
        timer = setTimeout(r, graceMs);
      }),
    ]);
    clearTimeout(timer);
    for (const e of active.values())
      e.controller.abort(new Error('Worker shutdown grace period ended'));
    await Promise.allSettled([...active.values()].map((e) => e.promise));
    try {
      await client.retire(w.id);
    } catch (error) {
      log({ type: 'retirement_failed', message: error.message });
    }
  }
  return counts;
}
