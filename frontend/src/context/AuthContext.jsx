import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { clearPersistedQueries } from '../lib/queryPersistence';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) syncUserProfile(currentUser);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
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
