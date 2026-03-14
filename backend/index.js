require('dotenv').config();
const express = require('express');
const cors = require('cors');

const taskRoutes = require('./routes/tasks');
const examRoutes = require('./routes/exams');
const chatRoutes = require('./routes/chat');
const subtaskRoutes = require('./routes/subtasks');
const uploadRoutes = require('./routes/upload');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subtasks', subtaskRoutes);
app.use('/api/upload', uploadRoutes);

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
