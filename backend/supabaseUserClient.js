const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const logger = require('./lib/logger');
const serviceClient = require('./supabaseClient');

if (!config.supabaseAnonKey) {
  logger.warn(
    'SUPABASE_ANON_KEY is not set; API queries use the service role and bypass Row Level Security',
  );
}

/**
 * Supabase client that acts as the signed-in user: it sends the user's access
 * token, so Postgres applies Row Level Security to every query, in addition to
 * the `user_id` filters in the controllers.
 *
 * Without SUPABASE_ANON_KEY this falls back to the service-role client, which
 * keeps existing deployments working but loses the RLS layer.
 * @param {string} accessToken The verified Supabase JWT from the request.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
function createUserClient(accessToken) {
  if (!config.supabaseAnonKey) return serviceClient;

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

module.exports = { createUserClient };
