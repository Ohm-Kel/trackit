const supabase = require('../supabaseClient');
const logger = require('../lib/logger');

/**
 * Verify the Supabase access token in the `Authorization: Bearer <token>`
 * header and attach the authenticated user to `req.user`.
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
      logger.info({ reason: error?.message }, 'Rejected invalid or expired token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
