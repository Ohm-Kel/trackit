const { rateLimit } = require('express-rate-limit');
const config = require('../config');

/**
 * Per-user limiter for endpoints that call the Anthropic API. Must run after
 * `authMiddleware` so requests are keyed by user id rather than IP (students
 * on a campus network often share one IP).
 *
 * Uses the default in-memory store; see docs/adr/0002-rate-limit-ai-endpoints.md
 * for the serverless trade-off.
 * @param {number} limit Requests allowed per window.
 */
function aiRateLimit(limit) {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => req.user.id,
    message: { error: 'AI request limit reached. Please try again later.' },
  });
}

const chatLimiter = aiRateLimit(config.rateLimit.chatMax);
const uploadLimiter = aiRateLimit(config.rateLimit.uploadMax);

module.exports = { aiRateLimit, chatLimiter, uploadLimiter };
