const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

/**
 * Parse a comma-separated environment variable into a trimmed, non-empty list.
 * @param {string | undefined} value
 * @returns {string[]}
 */
function parseList(value) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Parse a positive integer environment variable, falling back to a default.
 * @param {string | undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV || 'development';

const config = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  port: parsePositiveInt(process.env.PORT, 3001),
  logLevel: process.env.LOG_LEVEL || (nodeEnv === 'test' ? 'silent' : 'info'),

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,

  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',

  // Origins allowed to call the API cross-origin. Same-origin requests from the
  // deployed frontend do not need CORS headers, so this only matters for local
  // development and separately hosted frontends.
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS || 'http://localhost:5173'),

  rateLimit: Object.freeze({
    // 'supabase' shares counters across instances (needs supabase_migrations_002.sql);
    // 'memory' counts per process. Tests default to memory.
    store: process.env.RATE_LIMIT_STORE || (nodeEnv === 'test' ? 'memory' : 'supabase'),
    windowMs: parsePositiveInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
    chatMax: parsePositiveInt(process.env.AI_CHAT_RATE_LIMIT, 30),
    uploadMax: parsePositiveInt(process.env.AI_UPLOAD_RATE_LIMIT, 10),
  }),

  chat: Object.freeze({
    maxHistoryMessages: parsePositiveInt(process.env.CHAT_MAX_HISTORY_MESSAGES, 20),
    maxMessageChars: parsePositiveInt(process.env.CHAT_MAX_MESSAGE_CHARS, 4000),
    maxReplyTokens: 512,
  }),

  upload: Object.freeze({
    // Base64 inflates size by ~4/3, so 8.5 MB of base64 is ~6.4 MB of file.
    maxBase64Chars: parsePositiveInt(process.env.UPLOAD_MAX_BASE64_CHARS, 8.5 * 1024 * 1024),
  }),
});

module.exports = config;
