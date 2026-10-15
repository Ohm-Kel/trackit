import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';
import { useAuth } from '../context/AuthContext';
import { clearPersistedQueries, createUserPersister, MAX_AGE } from '../lib/queryPersistence';

// Bump when the shape of cached API data changes, to discard old caches.
const CACHE_VERSION = '1';
// Never hold the app back for long if IndexedDB is slow or unavailable.
const RESTORE_TIMEOUT_MS = 2000;

/**
 * Keeps the signed-in user's React Query cache in IndexedDB so pages can
 * show their last data offline (ADR 0006).
 *
 * The cache is restored only for the user it was saved for. When the user
 * signs out, or another user signs in, the in-memory cache is emptied and
 * every saved cache is deleted, so one user's data is never shown to
 * another on a shared device.
 */
export default function UserQueryCache({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;
  const [restoredFor, setRestoredFor] = useState(null);
  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current && previousUserId.current !== userId) {
      // The user signed out (or another signed in): forget their data.
      queryClient.clear();
      clearPersistedQueries().catch(() => {});
    }
    previousUserId.current = userId;
    if (!userId) return undefined;

    const { persister, dispose } = createUserPersister(userId);
    const options = { queryClient, persister, maxAge: MAX_AGE, buster: CACHE_VERSION };
    let unsubscribe;
    let cancelled = false;

    const timeout = new Promise((resolve) => setTimeout(resolve, RESTORE_TIMEOUT_MS));
    Promise.race([persistQueryClientRestore(options), timeout]).finally(() => {
      if (cancelled) return;
      unsubscribe = persistQueryClientSubscribe(options);
      setRestoredFor(userId);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      dispose();
    };
  }, [userId, queryClient]);

  // Render nothing until the saved cache is back (usually a few
  // milliseconds), so pages start from it rather than an empty list, and do
  // not fetch (and fail, when offline) before it is restored.
  if (userId && restoredFor !== userId) return null;
  return children;
}
