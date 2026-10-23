import { Store } from '../src/store.js';
import { createServer } from '../src/server.js';
import { serverConfig } from '../src/config.js';
import { startMaintenance } from '../src/runtime.js';
import { seedDemo } from '../src/demo.js';
import { Client } from '../src/client.js';
import { runWorker } from '../src/worker.js';
const config = serverConfig(process.argv.slice(2), process.env),
  store = new Store(config.db);
if (config.demo) seedDemo(store);
const server = createServer(store, {
    token: config.token,
    extraRoutes: config.demo
      ? [{ method: 'POST', path: '/api/demo', handler: () => seedDemo(store, { force: true }) }]
      : [],
  }),
  maintenance = startMaintenance(store, {
    onError: (e) => console.error('Maintenance:', e.message),
  }),
  controller = new AbortController();
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(config.port, config.host, resolve);
});
const local =
    config.host === '::1' ? '[::1]' : config.host === '0.0.0.0' ? '127.0.0.1' : config.host,
  url = 'http://' + local + ':' + server.address().port;
console.log('Distributed Job Engine: ' + url);
const workers =
  config.demo && !config.noWorkers
    ? [
        runWorker(new Client(url, { token: config.token }), {
          queues: ['media', 'analytics', 'notifications', 'default'],
          capacity: 4,
          signal: controller.signal,
          onEvent: (e) => {
            if (e.type === 'coordinator_error') console.error(e.message);
          },
        }).catch((e) => console.error('Embedded worker:', e.message)),
      ]
    : [];
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  controller.abort();
  await Promise.allSettled(workers);
  maintenance.stop();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  store.close();
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => close().then(() => process.exit(0)));
