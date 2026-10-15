// Entry point imported by the Vercel serverless function (api/index.js).
// Exports a ready-made Express app without listening on a port.
const { createApp } = require('./app');

module.exports = createApp();
