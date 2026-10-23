import { EngineError, requireThat } from './errors.js';
import { integer } from './validation.js';
export class Client {
  constructor(baseURL, { token, timeoutMs = 10000 } = {}) {
    const url = new URL(baseURL);
    requireThat(
      ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.pathname === '/' &&
        !url.search &&
        !url.hash,
      'CONFIG',
      'Client requires an HTTP origin',
    );
    integer(timeoutMs, 'timeoutMs', 100, 60000);
    this.baseURL = url.origin;
    this.token = token;
    this.timeoutMs = timeoutMs;
  }
  async request(method, path, body, { signal } = {}) {
    requireThat(/^\/api\//.test(path), 'CLIENT_PATH', 'Only API paths are accepted');
    const headers = { Accept: 'application/json' };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const timeout = AbortSignal.timeout(this.timeoutMs),
      response = await fetch(this.baseURL + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      });
    const data = await response.json();
    if (!response.ok)
      throw new EngineError(
        data.error?.code ?? 'HTTP',
        data.error?.message ?? 'Coordinator request failed',
        response.status,
      );
    return data;
  }
  submit(spec) {
    return this.request('POST', '/api/jobs', spec);
  }
  register(options) {
    return this.request('POST', '/api/workers', options);
  }
  touch(id, options = {}) {
    return this.request('POST', '/api/workers/' + id + '/touch', options);
  }
  claim(id, options = {}) {
    return this.request('POST', '/api/workers/' + id + '/claim', options);
  }
  heartbeat(id, token, options = {}) {
    return this.request('POST', '/api/jobs/' + id + '/heartbeat', { token, ...options });
  }
  complete(id, token, result, options = {}) {
    return this.request('POST', '/api/jobs/' + id + '/complete', { token, result, ...options });
  }
  fail(id, token, error) {
    return this.request('POST', '/api/jobs/' + id + '/fail', { token, error });
  }
  retire(id) {
    return this.request('POST', '/api/workers/' + id + '/retire', {});
  }
  get(id) {
    return this.request('GET', '/api/jobs/' + id);
  }
  overview() {
    return this.request('GET', '/api/overview');
  }
}
