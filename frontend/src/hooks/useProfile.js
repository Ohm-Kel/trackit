import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        const { data, error: supabaseError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (supabaseError) throw supabaseError;
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile in hook:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();

    // Set up real-time subscription for profile updates
    const channel = supabase
      .channel(`public:users:id=eq.${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { profile, loading, error };
}
