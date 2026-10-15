import { supabase } from '../lib/supabaseClient';
import { readEvents } from './sse';
import { API_URL } from './baseUrl';


async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Send a chat message and stream the reply as it is generated.
 *
 * @param {string} message - The user's current message.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history - Prior turns, excluding `message`.
 * @param {{ onDelta?: (text: string) => void, signal?: AbortSignal }} [options]
 *   `onDelta` receives each fragment of the reply in order.
 * @returns {Promise<{reply: string}>} The complete reply, once it has been saved.
 */
export async function streamChatMessage(message, history = [], { onDelta, signal } = {}) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...headers,
    },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to get AI response');
  }

  for await (const { event, data } of readEvents(res.body)) {
    if (event === 'delta') onDelta?.(data.text);
    else if (event === 'done') return { reply: data.reply };
    else if (event === 'error') throw new Error(data.error || 'The AI response was interrupted');
  }
  throw new Error('The AI response was interrupted');
}

/**
 * Load persisted chat history from the database.
 * @returns {Promise<Array<{role: string, content: string, created_at: string}>>}
 */
export async function fetchChatHistory() {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/chat/history`, { headers });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Clear all persisted chat history.
 */
export async function clearChatHistory() {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/chat/history`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error('Failed to clear history');
  return res.json();
}
