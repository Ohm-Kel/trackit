const pino = require('pino');
const config = require('../config');

/**
 * Application-wide structured logger. Emits JSON lines, which Vercel and
 * Docker log collectors can index by field. Authorization headers and API keys
 * are redacted defensively in case a request or error object is logged.
 */
const logger = pino({
  level: config.logLevel,
  base: { service: 'trackit-api' },
  redact: {
    paths: ['req.headers.authorization', '*.apiKey', '*.token', 'headers.authorization'],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
