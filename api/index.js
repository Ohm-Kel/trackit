// Vercel Serverless Function entry point
// Vercel only executes files in the /api directory as serverless functions.
// This file imports the Express app from the backend and exports it as a handler.
require('dotenv').config();
module.exports = require('../backend/index');
