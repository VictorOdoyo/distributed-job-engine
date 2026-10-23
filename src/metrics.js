import { statistics } from './statistics.js';
export function prometheus(store) {
  const s = statistics(store),
    lines = ['# HELP engine_jobs Current durable jobs by state.', '# TYPE engine_jobs gauge'];
  for (const [state, count] of Object.entries(s.states))
    lines.push('engine_jobs{state="' + state + '"} ' + count);
  lines.push(
    '# TYPE engine_workers_online gauge',
    'engine_workers_online ' + s.workers,
    '# TYPE engine_ready_lag_seconds gauge',
    'engine_ready_lag_seconds ' + s.readyLagMs / 1000,
    '# TYPE engine_outbox_pending gauge',
    'engine_outbox_pending ' + s.outbox,
    '# HELP engine_attempt_duration_seconds Completed successful attempt durations.',
    '# TYPE engine_attempt_duration_seconds histogram',
  );
  const buckets = [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60, 300, 3600, 7200],
    totals = store.db
      .prepare(
        "SELECT count(*) count,coalesce(sum((finished_at-started_at)/1000.0),0) total FROM attempts WHERE status='succeeded'",
      )
      .get();
  for (const bound of buckets) {
    const count = store.db
      .prepare(
        "SELECT count(*) count FROM attempts WHERE status='succeeded' AND finished_at-started_at<=?",
      )
      .get(bound * 1000).count;
    lines.push('engine_attempt_duration_seconds_bucket{le="' + bound + '"} ' + count);
  }
  lines.push(
    'engine_attempt_duration_seconds_bucket{le="+Inf"} ' + totals.count,
    'engine_attempt_duration_seconds_count ' + totals.count,
    'engine_attempt_duration_seconds_sum ' + totals.total,
  );
  return lines.join('\n') + '\n';
}
