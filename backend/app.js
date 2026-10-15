const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config');
const logger = require('./lib/logger');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const taskRoutes = require('./routes/tasks');
const examRoutes = require('./routes/exams');
const chatRoutes = require('./routes/chat');
const subtaskRoutes = require('./routes/subtasks');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

/**
 * Decide whether a cross-origin request may call the API. Requests without an
 * Origin header (same-origin GETs, curl, server-to-server) are allowed; browser
 * requests from other origins must be on the allowlist.
 */
function corsOrigin(origin, callback) {
  if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
  return callback(null, false);
}

function buildApiRouter() {
  const api = express.Router();

  api.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  api.use('/tasks', taskRoutes);
  api.use('/exams', examRoutes);
  api.use('/chat', chatRoutes);
  api.use('/subtasks', subtaskRoutes);
  api.use('/upload', uploadRoutes);
  api.use('/users', userRoutes);
  api.use('/notifications', notificationRoutes);
  api.use('/analytics', analyticsRoutes);

  return api;
}

/**
 * Build the Express application. Kept separate from `server.js` so tests and
 * the Vercel serverless entry point can import the app without opening a port.
 */
function createApp() {
  const app = express();

  // Vercel and Docker setups sit behind one proxy hop; needed for correct
  // client IPs in rate limiting and logs.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors({ origin: corsOrigin, credentials: true }));
  // Uploads arrive as base64 JSON; keep the limit just above the upload cap.
  app.use(express.json({ limit: '10mb' }));

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(
        {
          method: req.method,
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          durationMs,
        },
        'request completed',
      );
    });
    next();
  });

  const api = buildApiRouter();
  app.use('/api', api);
  // Vercel rewrites forward `/api/*` with the prefix intact, but some proxies
  // strip it. Mounting at the root as well keeps both setups working.
  app.use('/', api);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
