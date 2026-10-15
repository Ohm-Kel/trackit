const { z } = require('zod');
const anthropic = require('../lib/anthropic');
const config = require('../config');
const logger = require('../lib/logger');
const { fromAnthropicError } = require('../lib/errors');
const { validate } = require('../lib/validate');
const { buildSystemPrompt, buildMessages } = require('../lib/chatContext');

const turnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(config.chat.maxMessageChars),
});

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(config.chat.maxMessageChars),
  // Accept a generous history but only send the most recent turns to the model.
  history: z.array(turnSchema).max(200).default([]),
});

const FALLBACK_REPLY = 'Sorry, I could not generate a response.';

/**
 * Validate the request and build the model input: a system prompt grounded in
 * the student's tasks and exams, plus the capped conversation.
 */
async function prepareChat(req) {
  const { message, history } = validate(chatRequestSchema, req.body);
  const userId = req.user.id;

  const [tasksResult, examsResult] = await Promise.all([
    req.db
      .from('tasks')
      .select('title, status, due_date, grade_weight, estimated_hours, course_code, description')
      .eq('user_id', userId)
      .order('due_date', { ascending: true }),
    req.db
      .from('exams')
      .select('subject, exam_date, confidence_level, topics, course_code')
      .eq('user_id', userId)
      .order('exam_date', { ascending: true }),
  ]);
  if (tasksResult.error) throw tasksResult.error;
  if (examsResult.error) throw examsResult.error;

  const params = {
    model: config.anthropicModel,
    max_tokens: config.chat.maxReplyTokens,
    system: buildSystemPrompt({
      tasks: tasksResult.data,
      exams: examsResult.data,
      today: new Date().toISOString().slice(0, 10),
    }),
    messages: buildMessages(history, message, config.chat.maxHistoryMessages),
  };
  return { message, userId, params };
}

/** Log token usage and persist both turns. A failed save is logged, not thrown. */
async function finishChat(req, { userId, message, reply, usage, streamed }) {
  logger.info(
    { userId, inputTokens: usage?.input_tokens, outputTokens: usage?.output_tokens, streamed },
    'chat reply generated',
  );

  const { error } = await req.db.from('chat_history').insert([
    { user_id: userId, role: 'user', content: message },
    { user_id: userId, role: 'assistant', content: reply },
  ]);
  // The reply is still useful if persistence fails, so log rather than fail.
  if (error) logger.error({ err: error, userId }, 'Failed to persist chat history');
}

/**
 * POST /api/chat
 * Body: { message: string, history?: { role: 'user' | 'assistant', content: string }[] }
 *
 * Grounds Claude in the student's tasks and exams, returns its reply, and
 * persists both turns to chat_history.
 */
exports.chat = async (req, res) => {
  const { message, userId, params } = await prepareChat(req);

  let response;
  try {
    response = await anthropic.messages.create(params);
  } catch (err) {
    logger.error({ err, userId }, 'Anthropic chat request failed');
    throw fromAnthropicError(err);
  }

  const reply =
    response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim() || FALLBACK_REPLY;

  await finishChat(req, { userId, message, reply, usage: response.usage, streamed: false });
  res.json({ reply });
};

function startEventStream(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Stop nginx and similar proxies from buffering the stream.
    'X-Accel-Buffering': 'no',
  });
}

/** Write one server-sent event. */
function sendEvent(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /api/chat/stream
 * Same body as POST /api/chat. Responds with server-sent events:
 *   `delta` { text }   a fragment of the reply, in order
 *   `done`  { reply }  the complete reply, after it has been saved
 *   `error` { error }  a client-safe message if the model fails mid-reply
 *
 * Failures before the first token (validation, rate limit, upstream errors)
 * are ordinary JSON error responses, so clients handle them like /api/chat.
 */
exports.chatStream = async (req, res) => {
  const { message, userId, params } = await prepareChat(req);

  const stream = anthropic.messages.stream(params);
  let clientGone = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientGone = true;
      stream.abort();
    }
  });

  let reply = '';
  try {
    for await (const event of stream) {
      if (event.type !== 'content_block_delta' || event.delta.type !== 'text_delta') continue;
      // Headers go out with the first text, so anything failing before then
      // can still be a normal JSON error response.
      if (!res.headersSent) startEventStream(res);
      reply += event.delta.text;
      sendEvent(res, 'delta', { text: event.delta.text });
    }
  } catch (err) {
    if (clientGone) {
      logger.info({ userId }, 'Client closed chat stream; reply discarded');
      return;
    }
    logger.error({ err, userId }, 'Anthropic chat stream failed');
    const safe = fromAnthropicError(err);
    if (!res.headersSent) throw safe;
    sendEvent(res, 'error', { error: safe.message });
    res.end();
    return;
  }

  reply = reply.trim() || FALLBACK_REPLY;
  const final = await stream.finalMessage().catch(() => null);
  await finishChat(req, { userId, message, reply, usage: final?.usage, streamed: true });

  if (!res.headersSent) startEventStream(res);
  sendEvent(res, 'done', { reply });
  res.end();
};

/** GET /api/chat/history — the user's latest 100 messages, oldest first. */
exports.getHistory = async (req, res) => {
  const { data, error } = await req.db
    .from('chat_history')
    .select('role, content, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  res.json(data.reverse());
};

/** DELETE /api/chat/history */
exports.clearHistory = async (req, res) => {
  const { error } = await req.db.from('chat_history').delete().eq('user_id', req.user.id);
  if (error) throw error;
  res.json({ success: true });
};

exports.schemas = { chatRequestSchema };
