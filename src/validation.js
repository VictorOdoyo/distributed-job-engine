import { requireThat } from './errors.js';
export function integer(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
  requireThat(
    Number.isSafeInteger(value) && value >= min && value <= max,
    'VALIDATION',
    name + ' must be an integer in ' + min + '..' + max,
  );
  return value;
}
export function name(value, label = 'Name') {
  requireThat(
    typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(value),
    'VALIDATION',
    label + ' must be 1..64 safe identifier characters',
  );
  return value;
}
export function text(value, label, max = 512) {
  requireThat(
    typeof value === 'string' && value.length <= max,
    'VALIDATION',
    label + ' must be text of at most ' + max + ' characters',
  );
  return value;
}
export function record(value, label = 'Options') {
  requireThat(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
    'VALIDATION',
    label + ' must be a plain object',
  );
  return value;
}
export function fields(value, allowed) {
  record(value);
  for (const key of Object.keys(value))
    requireThat(allowed.includes(key), 'VALIDATION', 'Unknown field: ' + key);
  return value;
}
export function boolean(value, label) {
  requireThat(typeof value === 'boolean', 'VALIDATION', label + ' must be boolean');
  return value;
}
