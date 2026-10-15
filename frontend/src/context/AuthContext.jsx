import React, { createContext, useContext, useEffect, useState } from 'react';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { clearPersistedQueries } from '../lib/queryPersistence';

const AuthContext = createContext({});

/** The user of the session supabase-js has saved on this device, if any. */
function savedSessionUser() {
  try {
    return JSON.parse(localStorage.getItem(supabase.auth.storageKey))?.user ?? null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  // Offline, an expired access token cannot be refreshed: supabase-js keeps
  // the session to refresh later, but retries for up to 30 seconds and then
  // reports no session. Its user can still read their saved data (ADR 0007),
  // so start with them rather than wait or sign them out.
  const [user, setUser] = useState(() => (onlineManager.isOnline() ? null : savedSessionUser()));
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => user === null);
  const queryClient = useQueryClient();

  const syncUserProfile = async (sessionUser) => {
    if (!sessionUser) return;

    try {
      const userMetadata = sessionUser.user_metadata;

      const { error } = await supabase
        .from('users')
        .upsert({
          id: sessionUser.id,
          email: sessionUser.email,
          display_name: userMetadata?.full_name || userMetadata?.name || sessionUser.email?.split('@')[0],
          avatar_url: userMetadata?.avatar_url,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (error) console.error('Error syncing user profile to Supabase:', error.message);
    } catch (err) {
      console.error('Unexpected error during profile sync:', err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSession(session);
      const currentUser = session?.user ?? (isAuthRetryableFetchError(error) ? savedSessionUser() : null);
      setUser(currentUser);
      if (session) syncUserProfile(currentUser);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // The initial session is handled above, including the offline case.
        if (event === 'INITIAL_SESSION') return;
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (event === 'SIGNED_IN') {
          if (currentUser) syncUserProfile(currentUser);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
  };

  const signOut = async () => {
    // Forget this user's data on the device first, so it is gone even if
    // the sign-out request itself fails (for example while offline).
    queryClient.clear();
    await clearPersistedQueries().catch(() => {});
    return supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
