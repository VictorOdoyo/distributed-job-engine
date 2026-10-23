import { timingSafeEqual } from 'node:crypto';
import { EngineError, requireThat } from './errors.js';
export function validateToken(token) {
  requireThat(
    token === undefined || (typeof token === 'string' && token.length >= 24 && token.length <= 512),
    'CONFIG',
    'ENGINE_TOKEN must contain 24..512 characters',
    500,
  );
}
export function authorize(request, token) {
  if (!token) return;
  const header = request.headers.authorization ?? '',
    expected = Buffer.from('Bearer ' + token),
    actual = Buffer.from(header);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new EngineError('UNAUTHORIZED', 'Valid bearer token required', 401);
}
export function checkOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw new EngineError('ORIGIN', 'Invalid origin', 403);
  }
  const expected = (request.socket?.encrypted ? 'https:' : 'http:') + '//' + request.headers.host;
  requireThat(
    parsed.origin === expected,
    'ORIGIN',
    'Cross-origin API requests are not accepted',
    403,
  );
}
