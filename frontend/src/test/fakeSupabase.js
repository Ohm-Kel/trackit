import { vi } from 'vitest';

/**
 * In-memory stand-in for the Supabase browser client: auth with a switchable
 * session, the profile upsert AuthContext makes, and Realtime channels.
 *
 * Tests use it through `vi.mock('../lib/supabaseClient', ...)` (see
 * renderApp.jsx) and drive it with `signInAs()` / `signOut()`.
 */
export const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'ama@example.edu',
  user_metadata: { full_name: 'Ama Owusu' },
};

const listeners = new Set();
let session = null;

function emit(event) {
  for (const listener of listeners) listener(event, session);
}

const channel = { on: vi.fn(() => channel), subscribe: vi.fn(() => channel) };

export const supabase = {
  auth: {
    storageKey: 'sb-test-auth-token',
    getSession: vi.fn(async () => ({ data: { session } })),
    onAuthStateChange: vi.fn((listener) => {
      listeners.add(listener);
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    }),
    signInWithPassword: vi.fn(async ({ email, password }) => {
      if (password !== 'correct-horse') {
        return { data: {}, error: { message: 'Invalid login credentials' } };
      }
      signInAs({ ...USER, email });
      return { data: { session }, error: null };
    }),
    signUp: vi.fn(async () => ({ data: {}, error: null })),
    signInWithOAuth: vi.fn(async () => ({ data: {}, error: null })),
    signOut: vi.fn(async () => {
      signOut();
      return { error: null };
    }),
    resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
    updateUser: vi.fn(async () => ({ data: {}, error: null })),
  },
  from: vi.fn(() => ({ upsert: vi.fn(async () => ({ error: null })) })),
  channel: vi.fn(() => channel),
  removeChannel: vi.fn(),
};

export function signInAs(user = USER) {
  session = { access_token: 'test-jwt', user };
  emit('SIGNED_IN');
}

export function signOut() {
  session = null;
  emit('SIGNED_OUT');
}

export function resetSupabase() {
  session = null;
  listeners.clear();
  vi.clearAllMocks();
}
