import { el, badge, age, short, table, empty } from './dom.js';
export function renderOverview(data, onQueue) {
  const s = data.overview,
    defs = [
      ['Pending', s.states.waiting + s.states.blocked, 'waiting + blocked', '◷', ''],
      ['Running', s.states.running, 'currently leased', '↗', ''],
      ['Succeeded', s.states.succeeded, 'durable completions', '✓', 'metric-good'],
      ['Failed', s.states.failed, 'ready for inspection', '!', 'metric-warn'],
      ['Live workers', s.workers, 'accepting new jobs', '▤', ''],
      [
        'P95 duration',
        s.latency.p95 == null ? '—' : s.latency.p95 + ' ms',
        s.latency.samples + ' samples / last 24h',
        '⌁',
        '',
      ],
    ];
  document
    .getElementById('metrics')
    .replaceChildren(
      ...defs.map(([label, value, note, icon, color]) =>
        el(
          'article',
          { class: 'metric' },
          el('div', { class: 'metric-head' }, label, el('span', { class: 'metric-icon' }, icon)),
          el('strong', { class: color }, value),
          el('small', {}, note),
        ),
      ),
    );
  const host = document.getElementById('queues');
  host.replaceChildren(
    ...s.queues.map((q) =>
      el(
        'div',
        { class: 'queue-row' },
        el(
          'div',
          { class: 'queue-name' },
          el('button', { onclick: () => onQueue(q) }, q.name),
          badge(q.paused ? 'draining' : 'online'),
        ),
        el(
          'div',
          { class: 'queue-meta' },
          q.waiting + ' waiting',
          q.running + ' / ' + q.concurrency + ' active',
        ),
        el('progress', {
          max: q.concurrency,
          value: q.running,
          'aria-label': q.name + ' active capacity',
        }),
      ),
    ),
  );
  if (!s.queues.length) host.append(empty('No queues yet. Submit a job to begin.'));
  document.getElementById('chart-total').textContent =
    data.history.points.reduce((n, p) => n + p.succeeded, 0) + ' completions in this window';
  document.getElementById('nav-job-count').textContent = s.total;
}
export function renderJobs(host, jobs, onOpen) {
  if (!jobs.length) {
    host.replaceChildren(empty('No matching jobs. Submit work or change your filters.'));
    return;
  }
  host.replaceChildren(
    table(
      ['JOB / HANDLER', 'STATE', 'QUEUE', 'ATTEMPTS', 'CREATED', 'DURATION'],
      jobs.map((j) => [
        el(
          'button',
          { class: 'row-button', onclick: () => onOpen(j.id) },
          el('span', { class: 'job-kind' }, j.kind),
          el('span', { class: 'job-id' }, short(j.id)),
        ),
        badge(j.state),
        el('span', { class: 'mono' }, j.queue),
        j.attempts + ' / ' + j.max_attempts,
        age(j.created_at),
        j.finished_at && j.started_at ? Math.max(0, j.finished_at - j.started_at) + ' ms' : '—',
      ]),
    ),
  );
}
