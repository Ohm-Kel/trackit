require('dotenv').config();
const express = require('express');
const cors = require('cors');

const taskRoutes = require('./routes/tasks');
const examRoutes = require('./routes/exams');
const chatRoutes = require('./routes/chat');
const subtaskRoutes = require('./routes/subtasks');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3001;

// Middleware — allow localhost in dev and any vercel.app origin in production
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin / server-to-server
    if (origin.includes('localhost')) return callback(null, true);
    if (origin.includes('vercel.app')) return callback(null, true);
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    callback(null, true); // permissive for student project
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trackit API is running' });
});

// Export the app for Vercel Serverless Functions
module.exports = app;

// Only listen locally if not running in Vercel production
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
