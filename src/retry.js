import { createHash } from 'node:crypto';
import { integer } from './validation.js';
export function retryDelay(attempt, { base = 1000, cap = 60000, jitter = true, key = '' } = {}) {
  integer(attempt, 'attempt', 1, 1000);
  integer(base, 'base', 0, 86400000);
  integer(cap, 'cap', base, 604800000);
  const upper = Math.min(cap, base * 2 ** Math.min(attempt - 1, 40));
  if (!jitter || upper === 0) return upper;
  const unit =
    createHash('sha256')
      .update(key + ':' + attempt)
      .digest()
      .readUInt32BE(0) / 4294967296;
  return Math.floor(upper * (0.5 + 0.5 * unit));
}
export function classifyFailure(error) {
  const code = String(error?.code ?? 'HANDLER_ERROR').slice(0, 64),
    message = String(error?.message ?? error ?? 'Unknown failure').slice(0, 2000);
  return { code, message, retryable: error?.retryable !== false };
}
