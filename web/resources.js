import { el, badge, short, time, age, empty } from './dom.js';
export function renderResource(host, view, data, actions) {
  let nodes = [];
  if (view === 'workers')
    nodes = data.workers.map((w) =>
      el(
        'article',
        { class: 'resource-card' },
        el(
          'div',
          { class: 'resource-top' },
          el('h3', {}, 'Worker ' + short(w.id)),
          badge(w.live ? w.status : 'offline'),
        ),
        el('p', {}, w.queues.join(' · ') + ' / ' + w.active + ' active / capacity ' + w.capacity),
        el(
          'p',
          {},
          'Heartbeat ' +
            age(w.last_seen) +
            ' · ' +
            (w.metadata.isolated ? 'Isolated handler threads' : 'External worker'),
        ),
        el(
          'div',
          { class: 'resource-actions' },
          el(
            'button',
            {
              disabled: !w.live,
              onclick: () => actions.worker(w, w.status === 'draining' ? 'online' : 'draining'),
            },
            w.status === 'draining' ? 'Resume claims' : 'Drain worker',
          ),
        ),
      ),
    );
  if (view === 'schedules')
    nodes = data.schedules.map((s) =>
      el(
        'article',
        { class: 'resource-card' },
        el(
          'div',
          { class: 'resource-top' },
          el('h3', {}, s.kind),
          badge(s.paused ? 'draining' : 'online'),
        ),
        el(
          'p',
          {},
          s.queue +
            ' · ' +
            (s.cron ? 'UTC cron ' + s.cron : 'Every ' + s.interval_ms / 1000 + ' seconds'),
        ),
        el(
          'p',
          {},
          'Next due ' +
            new Date(s.next_at).toLocaleString() +
            ' · catch-up ' +
            (s.catch_up ? 'enabled' : 'disabled'),
        ),
        el(
          'div',
          { class: 'resource-actions' },
          el(
            'button',
            { onclick: () => actions.schedule(s) },
            s.paused ? 'Resume schedule' : 'Pause schedule',
          ),
        ),
      ),
    );
  if (view === 'workflows')
    nodes = data.workflows.map((w) =>
      el(
        'article',
        { class: 'resource-card' },
        el('div', { class: 'resource-top' }, el('h3', {}, w.name), badge(w.state)),
        el('p', {}, w.succeeded + ' / ' + w.nodes + ' nodes completed · ' + short(w.id)),
        el('progress', { value: w.succeeded, max: w.nodes, 'aria-label': 'Workflow completion' }),
        el(
          'div',
          { class: 'resource-actions' },
          el('button', { onclick: () => actions.workflow(w.id) }, 'Inspect graph ↗'),
        ),
      ),
    );
  if (view === 'events')
    nodes = [
      el(
        'div',
        { class: 'panel' },
        [...data.events]
          .reverse()
          .map((e) =>
            el(
              'div',
              { class: 'event-row' },
              el('i', { class: 'event-dot' }),
              el('span', { class: 'event-time' }, time(e.time)),
              el('span', { class: 'event-type' }, e.type),
              el(
                'span',
                { class: 'event-job' },
                e.queue ?? 'system',
                e.job_id ? ' / ' + short(e.job_id) : '',
              ),
            ),
          ),
      ),
    ];
  host.replaceChildren(
    el(
      'div',
      { class: 'resource-list' },
      nodes.length ? nodes : empty('No ' + view + ' recorded on this coordinator.'),
    ),
  );
}
