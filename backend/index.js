require('dotenv').config();
const express = require('express');
const cors = require('cors');

const taskRoutes = require('./routes/tasks');
const examRoutes = require('./routes/exams');
const chatRoutes = require('./routes/chat');
const subtaskRoutes = require('./routes/subtasks');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const port = process.env.PORT || 3001;

// Middleware — allow localhost in dev and any vercel.app origin in production
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);
    if (origin.includes('vercel.app')) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Logging for remote debugging on Vercel
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Resilient Route Mounting: 
// Vercel rewrites might strip /api or pass it through. 
// We mount on both to be safe.
const mountRoutes = (basePath) => {
  app.use(`${basePath}/tasks`, taskRoutes);
  app.use(`${basePath}/exams`, examRoutes);
  app.use(`${basePath}/chat`, chatRoutes);
  app.use(`${basePath}/subtasks`, subtaskRoutes);
  app.use(`${basePath}/upload`, uploadRoutes);
  app.use(`${basePath}/users`, userRoutes);
  app.use(`${basePath}/notifications`, notificationRoutes);
  app.use(`${basePath}/analytics`, analyticsRoutes);
};

mountRoutes('/api'); // Standard
mountRoutes('');     // For cases where /api is stripped by proxy

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trackit API is running', timestamp: new Date() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trackit API is running (via /api)', timestamp: new Date() });
});

app.get('/api/debug-env', (req, res) => {
  res.json({
    supabase_url_set: !!process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder'),
    supabase_key_set: !!process.env.SUPABASE_SERVICE_KEY && !process.env.SUPABASE_SERVICE_KEY.includes('placeholder'),
    node_env: process.env.NODE_ENV,
    vercel_env: !!process.env.VERCEL,
    cwd: process.cwd(),
    __dirname: __dirname
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(`[CRITICAL ERROR] ${new Date().toISOString()}:`, err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    path: req.url,
    timestamp: new Date().toISOString()
  });
});

// Export the app for Vercel Serverless Functions
module.exports = app;

// Only listen locally if not running in Vercel production
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
