import { supabase } from '../lib/supabaseClient';
import { API_URL } from './baseUrl';

/** Authorization header for the signed-in user, or none when signed out. */
export async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

/**
 * Call the Trackit API as the signed-in user.
 *
 * Throws an Error carrying the API's own message (for example a validation
 * error) and the HTTP status, falling back to `fallbackError` when the
 * response has no JSON body.
 *
 * @param {string} path API path, starting with '/'.
 * @param {{ method?: string, body?: unknown, headers?: object, signal?: AbortSignal, fallbackError?: string }} [options]
 * @returns {Promise<Response>}
 */
export async function apiRequest(path, { method = 'GET', body, headers = {}, signal, fallbackError } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
      ...(await authHeaders()),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || `${fallbackError || 'Request failed'} (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return res;
}

/** Like apiRequest, returning the parsed JSON body. */
export async function apiJson(path, options) {
  return (await apiRequest(path, options)).json();
}
