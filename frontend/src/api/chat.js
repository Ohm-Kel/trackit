import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.PROD
  ? '/api'
  : import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Send a chat message to the AI and receive a reply.
 *
 * @param {string} message - The user's current message.
 * @param {Array<{role: 'user'|'ai', text: string}>} history - Prior messages.
 * @returns {Promise<{reply: string}>}
 */
export async function sendChatMessage(message, history = []) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to get AI response');
  }

  return res.json();
}
