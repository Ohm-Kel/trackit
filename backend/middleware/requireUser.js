const authMiddleware = require('./authMiddleware');
const { apiLimiter } = require('./rateLimit');

/** Authenticate the request, then apply the general per-user rate limit. */
module.exports = [authMiddleware, apiLimiter];
