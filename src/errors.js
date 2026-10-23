export class EngineError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'EngineError';
    this.code = code;
    this.status = status;
  }
}
export function requireThat(condition, code, message, status = 400) {
  if (!condition) throw new EngineError(code, message, status);
}
export function notFound(name = 'Resource') {
  throw new EngineError('NOT_FOUND', name + ' not found', 404);
}
export function normalizeError(error) {
  if (error instanceof EngineError) return error;
  if (
    error?.errcode === 5 ||
    error?.code === 'SQLITE_BUSY' ||
    /database is locked/.test(error?.message ?? '')
  )
    return new EngineError('STORE_BUSY', 'Coordinator is busy; retry later', 503);
  return new EngineError('INTERNAL', 'Internal coordinator error', 500);
}
