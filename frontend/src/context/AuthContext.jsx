import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (sessionUser) => {
    if (!sessionUser) return;

    try {
      const { data: metadata } = await supabase.auth.getUser();
      const userMetadata = metadata.user?.user_metadata;

      if (userMetadata) {
        const { error } = await supabase
          .from('users')
          .upsert({
            id: sessionUser.id,
            email: sessionUser.email,
            display_name: userMetadata.full_name || userMetadata.name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name,
            avatar_url: userMetadata.avatar_url || sessionUser.user_metadata?.avatar_url,
          }, {
            onConflict: 'id',
            ignoreDuplicates: false // We want to update display_name and avatar_url if they changed
          });

        if (error) console.error('Error syncing user profile:', error);
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err);
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

  const signOut = () => {
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
