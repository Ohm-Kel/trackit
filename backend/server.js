// Local and container entry point: `npm start` or `docker compose up`.
const app = require('./index');
const config = require('./config');
const logger = require('./lib/logger');

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Trackit API listening');
});

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
