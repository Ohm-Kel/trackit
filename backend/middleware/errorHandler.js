const { HttpError } = require('../lib/errors');
const logger = require('../lib/logger');

/** 404 handler for unmatched routes. */
function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

/**
 * Central error handler. Client-safe errors keep their status and message;
 * everything else is logged and returned as a generic 500 so internal details
 * (database messages, stack traces) never reach the client.
 */
// Express identifies error handlers by their four-argument signature.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }

  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
