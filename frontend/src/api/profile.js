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
    let errorMessage = `Server error (${res.status})`;
    let details = null;

    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
      details = errorData.details;
    } catch (e) {
      // If not JSON, it might be a Vercel 404 HTML page
      errorMessage = `HTTP ${res.status}: ${res.statusText || 'Unknown Error'}`;
      details = 'The server returned a non-JSON response. This often means a routing mismatch (404) or a crash.';
    }

    const error = new Error(errorMessage);
    error.details = details;
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

  if (!res.ok) {
    let errorMessage = `Failed to update profile (${res.status})`;
    let details = null;

    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
      details = errorData.details;
    } catch (e) {
      errorMessage = `HTTP ${res.status}: ${res.statusText || 'Unknown Error'}`;
      details = 'The server returned a non-JSON response during update.';
    }

    const error = new Error(errorMessage);
    error.details = details;
    error.status = res.status;
    throw error;
  }
  
  return await res.json();
}
