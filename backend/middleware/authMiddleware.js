const supabase = require('../supabaseClient');
const { createUserClient } = require('../supabaseUserClient');
const logger = require('../lib/logger');
const { recordFailure } = require('../lib/authFailures');

/**
 * Verify the Supabase access token in the `Authorization: Bearer <token>`
 * header, attach the authenticated user to `req.user`, and attach a Supabase
 * client that queries as that user (so RLS applies) to `req.db`.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      recordFailure(req.ip);
      logger.info({ reason: error?.message }, 'Rejected invalid or expired token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    req.db = createUserClient(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
