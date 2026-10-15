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

/**
 * General per-user limit on every authenticated route, as a backstop against
 * runaway clients and scripted scraping. Generous enough that normal use
 * (a page load makes a handful of requests) never reaches it. Counted per
 * instance in memory: it guards the database rather than a paid API, so an
 * extra database round trip per request is not worth it.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.rateLimit.apiPerMinute,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  message: { error: 'Too many requests. Please slow down.' },
});

/**
 * Per-IP limit on the calendar feed, which has no user to key on. Calendar
 * services fetch every subscriber's feed from a few shared IPs, so the limit
 * is high: it only stops a client hammering the database. Kept apart from the
 * failed-auth counter, so reaching it never blocks other routes.
 */
const calendarFeedLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: config.rateLimit.calendarFeedPerMinute,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many calendar requests. Please try again later.' },
});

module.exports = { aiRateLimit, chatLimiter, uploadLimiter, apiLimiter, calendarFeedLimiter };
