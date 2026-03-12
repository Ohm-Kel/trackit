require('dotenv').config();
const express = require('express');
const cors = require('cors');

const taskRoutes = require('./routes/tasks');
const examRoutes = require('./routes/exams');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/exams', examRoutes);

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
