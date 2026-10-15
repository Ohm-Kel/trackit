import { onlineManager } from '@tanstack/react-query';
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
  // Controls that write are disabled offline; this catches any that are not.
  if (method !== 'GET' && !onlineManager.isOnline()) {
    const error = new Error("You're offline. Reconnect to save changes.");
    error.offline = true;
    throw error;
  }
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
    const data = await res.json().catch(() => null);
    const error = new Error(data?.error || `${fallbackError || 'Request failed'} (${res.status})`);
    error.status = res.status;
    error.requestId = data?.requestId;
    if (!data) {
      error.details =
        'The server returned a non-JSON response. This often means a routing mismatch (404) or a crash.';
    }
    throw error;
  }
  return res;
}

/** Like apiRequest, returning the parsed JSON body. */
export async function apiJson(path, options) {
  return (await apiRequest(path, options)).json();
}
