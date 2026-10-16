import { createStore, del, delMany, get, keys, set, clear } from 'idb-keyval';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/**
 * React Query's cache, saved to IndexedDB so signed-in pages can show the
 * last data they loaded when the device is offline (ADR 0007).
 *
 * Each user's cache is stored under their own key, so one user can never
 * restore another's, and every entry is deleted on sign-out.
 */
const store = createStore('trackit-offline', 'query-cache');

/** How long saved data may be shown offline before it is discarded. */
export const MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const cacheKey = (userId) => `user:${userId}`;

/**
 * A persister for one user's cache. Call `dispose()` when that user signs
 * out: the persister throttles writes, and a write still pending must not
 * save their data again after it has been cleared.
 */
export function createUserPersister(userId) {
  let active = true;
  const persister = createAsyncStoragePersister({
    key: cacheKey(userId),
    storage: {
      getItem: (key) => get(key, store),
      setItem: (key, value) => (active ? set(key, value, store) : Promise.resolve()),
      removeItem: (key) => del(key, store),
    },
    // IndexedDB stores objects directly; no need to go through JSON.
    serialize: (data) => data,
    deserialize: (data) => data,
    throttleTime: 1000,
  });
  return {
    persister,
    dispose: () => {
      active = false;
    },
  };
}

/** Read one user's saved cache (for tests and diagnostics). */
export const readUserCache = (userId) => get(cacheKey(userId), store);

/** Delete every user's saved cache. */
export const clearPersistedQueries = () => clear(store);

/**
 * Delete every saved cache except this user's. A user who closed the app
 * without signing out leaves their cache behind; it must not stay on the
 * device once someone else signs in.
 */
export async function clearOtherUsersCaches(userId) {
  const others = (await keys(store)).filter((key) => key !== cacheKey(userId));
  if (others.length) await delMany(others, store);
}
