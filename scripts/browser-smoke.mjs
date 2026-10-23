import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { Store, createServer, Client, runWorker, startMaintenance, submit } from '../src/index.js';
import { seedDemo } from '../src/demo.js';
const { chromium } = createRequire(import.meta.url)('playwright'),
  store = new Store(),
  controller = new AbortController();
seedDemo(store);
const server = createServer(store, {
  rateLimit: false,
  extraRoutes: [
    { method: 'POST', path: '/api/demo', handler: () => seedDemo(store, { force: true }) },
  ],
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = 'http://127.0.0.1:' + server.address().port,
  service = startMaintenance(store, { intervalMs: 100 }),
  worker = runWorker(new Client(base), {
    queues: ['media', 'analytics', 'notifications', 'default'],
    capacity: 4,
    pollMs: 50,
    leaseMs: 3000,
    signal: controller.signal,
  });
const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  }),
  page = await browser.newPage({ viewport: { width: 1440, height: 1080 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let checks = 0;
const check = (value) => {
  assert(value);
  checks++;
};
const wait = (fn) => page.waitForFunction(fn, null, { timeout: 15000 });
try {
  await page.goto(base);
  await wait(() => document.querySelector('#live-status').dataset.live === 'true');
  check((await page.locator('#metrics .metric').count()) === 6);
  check((await page.locator('#jobs-table tbody tr').count()) > 0);
  check((await page.locator('#activity-chart svg').count()) === 1);
  await page.locator('[data-view="workers"]').click();
  await wait(
    () =>
      document.querySelector('#resource-view button') &&
      !document.querySelector('#resource-view button').disabled,
  );
  await page.getByRole('button', { name: 'Drain worker', exact: true }).click();
  await page.getByRole('button', { name: 'Resume claims', exact: true }).waitFor();
  check(store.db.prepare('SELECT status FROM workers').get().status === 'draining');
  await page.getByRole('button', { name: 'Resume claims', exact: true }).click();
  await page.getByRole('button', { name: 'Drain worker', exact: true }).waitFor();
  check(store.db.prepare('SELECT status FROM workers').get().status === 'online');
  await page.locator('[data-view="schedules"]').click();
  await page.getByRole('button', { name: 'Pause schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Resume schedule', exact: true }).waitFor();
  check(store.db.prepare('SELECT paused FROM schedules').get().paused === 1);
  await page.getByRole('button', { name: 'Resume schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Pause schedule', exact: true }).waitFor();
  check(store.db.prepare('SELECT paused FROM schedules').get().paused === 0);
  await page.locator('#new-schedule').click();
  await page.locator('#job-kind').selectOption('report.aggregate');
  await page.locator('#schedule-interval').fill('120');
  await page.locator('#submit-job').click();
  await page.locator('#job-dialog').waitFor({ state: 'hidden' });
  check(store.db.prepare('SELECT count(*) n FROM schedules').get().n === 2);
  await page.locator('[data-view="workflows"]').click();
  await page.getByRole('button', { name: 'Inspect graph ↗' }).first().click();
  check((await page.locator('.dag-node').count()) === 4);
  await page.locator('[data-close="detail-dialog"]').click();
  await page.locator('#new-job').click();
  await page.locator('#job-payload').fill('broken');
  await page.locator('#submit-job').click();
  check(await page.locator('#job-dialog').isVisible());
  check((await page.locator('#form-error').innerText()).length > 0);
  await page.locator('#job-kind').selectOption('report.aggregate');
  await page.locator('#job-payload').fill('{"values":[5,7,9]}');
  await page.locator('#job-queue').fill('analytics');
  const response = page.waitForResponse(
    (r) => r.url() === base + '/api/jobs' && r.request().method() === 'POST',
  );
  await page.locator('#submit-job').click();
  const created = (await (await response).json()).job;
  await page.locator('#job-dialog').waitFor({ state: 'hidden' });
  await new Promise((resolve, reject) => {
    const end = Date.now() + 10000;
    const timer = setInterval(() => {
      const row = store.db.prepare('SELECT state,result FROM jobs WHERE id=?').get(created.id);
      if (row.state === 'succeeded') {
        clearInterval(timer);
        try {
          assert.equal(JSON.parse(row.result).mean, 7);
          resolve();
        } catch (e) {
          reject(e);
        }
      } else if (Date.now() > end) {
        clearInterval(timer);
        reject(new Error('Browser-submitted job did not finish'));
      }
    }, 50);
  });
  check(true);
  await page.locator('[data-view="jobs"]').click();
  await page.locator('#state-filter').selectOption('failed');
  await wait(() => document.querySelector('#jobs-table .badge.failed'));
  await page.locator('#jobs-table .row-button').first().click();
  check((await page.locator('#detail-content').innerText()).includes('PERMANENT'));
  await page.locator('#detail-content input[name="note"]').fill('Browser verification note');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByText('Browser verification note — operator', { exact: true }).waitFor();
  check(true);
  await page.getByRole('button', { name: 'Replay as a new job', exact: true }).click();
  check((await page.locator('#message').innerText()).includes('replay'));
  await page.locator('[data-close="detail-dialog"]').click();
  await page.locator('[data-view="events"]').click();
  check((await page.locator('#resource-view .event-row').count()) > 0);
  await page.locator('[data-view="overview"]').click();
  await page.locator('#state-filter').selectOption('');
  const q = store.db.prepare('SELECT name FROM queues ORDER BY name LIMIT 1').get().name;
  await page.locator('#queues .queue-name button').filter({ hasText: q }).click();
  await wait(() => document.querySelector('#message').textContent === 'Queue paused.');
  check(store.db.prepare('SELECT paused FROM queues WHERE name=?').get(q).paused === 1);
  await page.locator('#queues .queue-name button').filter({ hasText: q }).click();
  await wait(() => document.querySelector('#message').textContent === 'Queue resumed.');
  check(store.db.prepare('SELECT paused FROM queues WHERE name=?').get(q).paused === 0);
  await page.locator('#seed').click();
  await wait(() => document.querySelector('#message').textContent.includes('demo batch'));
  check(store.db.prepare('SELECT count(*) n FROM jobs').get().n > 30);
  mkdirSync('results', { recursive: true });
  await page.screenshot({ path: 'results/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  check(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
  await page.screenshot({ path: 'results/mobile.png', fullPage: true });
  check(errors.length === 0);
  console.log(JSON.stringify({ browserChecks: checks, pageErrors: errors }, null, 2));
} finally {
  await browser.close();
  controller.abort();
  await worker;
  service.stop();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  store.close();
}
