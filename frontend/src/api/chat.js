import { apiJson, apiRequest } from './http';
import { readEvents } from './sse';

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
  const res = await apiRequest('/chat/stream', {
    method: 'POST',
    body: { message, history },
    headers: { Accept: 'text/event-stream' },
    signal,
    fallbackError: 'Failed to get AI response',
  });
  if (!res.body) throw new Error('Failed to get AI response');

  for await (const { event, data } of readEvents(res.body)) {
    if (event === 'delta') onDelta?.(data.text);
    else if (event === 'done') return { reply: data.reply };
    else if (event === 'error') throw new Error(data.error || 'The AI response was interrupted');
  }
  throw new Error('The AI response was interrupted');
}

/**
 * Load persisted chat history from the database. Returns [] if it cannot be
 * loaded, so the chat still opens.
 * @returns {Promise<Array<{role: string, content: string, created_at: string}>>}
 */
export function fetchChatHistory() {
  return apiJson('/chat/history').catch(() => []);
}

/**
 * Clear all persisted chat history.
 */
export function clearChatHistory() {
  return apiJson('/chat/history', { method: 'DELETE', fallbackError: 'Failed to clear history' });
}
