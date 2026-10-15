const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

/** Shared Anthropic client, reused across requests and serverless invocations. */
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey, maxRetries: 2 });

module.exports = anthropic;
