const { MemoryStore } = require('express-rate-limit');
const logger = require('./logger');

/**
 * `express-rate-limit` store that keeps counters in Postgres through the
 * `rate_limit_hit` function (supabase_migrations_002.sql), so a limit holds
 * across every serverless instance rather than per warm instance.
 *
 * If the database call fails (for example, the migration has not been run),
 * the request is counted in an in-memory store instead. Limits then degrade to
 * the old per-instance behaviour rather than switching off entirely.
 */
class SupabaseRateLimitStore {
  /**
   * @param {{ client: import('@supabase/supabase-js').SupabaseClient, prefix: string }} options
   *   client must use the service role; prefix keeps each limiter's counters apart.
   */
  constructor({ client, prefix }) {
    this.client = client;
    this.prefix = prefix;
    this.localKeys = false;
    this.fallback = new MemoryStore();
    this.degraded = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
    this.fallback.init(options);
  }

  async increment(key) {
    const { data, error } = await this.client.rpc('rate_limit_hit', {
      p_key: this.prefix + key,
      p_window_ms: this.windowMs,
    });
    const row = Array.isArray(data) ? data[0] : data;

    if (error || !row) {
      // Log once per outage rather than on every request.
      if (!this.degraded) {
        logger.error(
          { err: error, prefix: this.prefix },
          'Shared rate-limit store unavailable; counting in memory for this instance',
        );
        this.degraded = true;
      }
      return this.fallback.increment(key);
    }

    if (this.degraded) {
      logger.info({ prefix: this.prefix }, 'Shared rate-limit store recovered');
      this.degraded = false;
    }
    return { totalHits: row.total_hits, resetTime: new Date(row.resets_at) };
  }

  async decrement(key) {
    await this.client.rpc('rate_limit_decrement', { p_key: this.prefix + key });
    await this.fallback.decrement(key);
  }

  async resetKey(key) {
    await this.client
      .from('rate_limits')
      .delete()
      .eq('key', this.prefix + key);
    await this.fallback.resetKey(key);
  }

  shutdown() {
    this.fallback.shutdown();
  }
}

module.exports = { SupabaseRateLimitStore };
