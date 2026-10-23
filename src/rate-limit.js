import { integer } from './validation.js';
export class RateLimiter {
  constructor({
    capacity = 200,
    perSecond = 100,
    maxClients = 1000,
    clock = () => performance.now(),
  } = {}) {
    integer(capacity, 'capacity', 1, 100000);
    integer(perSecond, 'perSecond', 1, 100000);
    integer(maxClients, 'maxClients', 1, 10000);
    this.capacity = capacity;
    this.perSecond = perSecond;
    this.maxClients = maxClients;
    this.clock = clock;
    this.clients = new Map();
  }
  allow(key) {
    const now = this.clock(),
      old = this.clients.get(key),
      tokens = old
        ? Math.min(this.capacity, old.tokens + (Math.max(0, now - old.at) * this.perSecond) / 1000)
        : this.capacity;
    this.clients.delete(key);
    if (this.clients.size >= this.maxClients) this.clients.delete(this.clients.keys().next().value);
    const allowed = tokens >= 1;
    this.clients.set(key, { tokens: allowed ? tokens - 1 : tokens, at: now });
    return allowed;
  }
}
