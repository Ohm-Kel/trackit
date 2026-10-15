const { rateLimit } = require('express-rate-limit');
const config = require('../config');
const supabase = require('../supabaseClient');
const { SupabaseRateLimitStore } = require('../lib/rateLimitStore');

/**
 * Per-user limiter for endpoints that call the Anthropic API. Must run after
 * `authMiddleware` so requests are keyed by user id rather than IP (students
 * on a campus network often share one IP).
 *
 * Counters live in Postgres by default so the limit holds across serverless
 * instances; see docs/adr/0002-rate-limit-ai-endpoints.md.
 * @param {string} name Distinguishes this limiter's counters in the shared store.
 * @param {number} limit Requests allowed per window.
 */
function aiRateLimit(name, limit) {
  const store =
    config.rateLimit.store === 'supabase'
      ? new SupabaseRateLimitStore({ client: supabase, prefix: `${name}:` })
      : undefined;

  return rateLimit({
    store,
    windowMs: config.rateLimit.windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => req.user.id,
    message: { error: 'AI request limit reached. Please try again later.' },
  });
}

const chatLimiter = aiRateLimit('chat', config.rateLimit.chatMax);
const uploadLimiter = aiRateLimit('upload', config.rateLimit.uploadMax);

module.exports = { aiRateLimit, chatLimiter, uploadLimiter };
