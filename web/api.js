let token = '';
export function setToken(value) {
  token = value;
}
export async function api(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch('/api/' + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message ?? 'Coordinator request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}
