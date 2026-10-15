const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const logger = require('./lib/logger');

if (!config.supabaseUrl || !config.supabaseServiceKey) {
  logger.warn('SUPABASE_URL or SUPABASE_SERVICE_KEY is not set; database calls will fail');
}

/**
 * Server-side Supabase client using the service role key.
 *
 * The service role bypasses Row Level Security, so every query made with this
 * client MUST filter by the authenticated user's id (`req.user.id`).
 */
const supabase = createClient(
  config.supabaseUrl || 'http://localhost:54321',
  config.supabaseServiceKey || 'missing-service-key',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

module.exports = supabase;
