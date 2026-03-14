import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { 'Authorization': `Bearer ${session.access_token}` };
}

export async function fetchProfile() {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/users/profile`, { headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to fetch profile');
    error.details = errorData.details;
    error.status = res.status;
    throw error;
  }
  
  return await res.json();
}

export async function updateProfile(updates) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return await res.json();
}
