// Vercel serverless function entry point. Vercel only runs files in /api as
// functions, so this re-exports the Express app built in the backend package.
module.exports = require('../backend/index');
