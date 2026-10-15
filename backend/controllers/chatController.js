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
 * POST /api/chat
 * Body: { message: string, history?: { role: 'user' | 'assistant', content: string }[] }
 *
 * Grounds Claude in the student's tasks and exams, returns its reply, and
 * persists both turns to chat_history.
 */
exports.chat = async (req, res) => {
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

  const system = buildSystemPrompt({
    tasks: tasksResult.data,
    exams: examsResult.data,
    today: new Date().toISOString().slice(0, 10),
  });
  const messages = buildMessages(history, message, config.chat.maxHistoryMessages);

  let response;
  try {
    response = await anthropic.messages.create({
      model: config.anthropicModel,
      max_tokens: config.chat.maxReplyTokens,
      system,
      messages,
    });
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

  logger.info(
    {
      userId,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
    'chat reply generated',
  );

  const { error: saveError } = await req.db.from('chat_history').insert([
    { user_id: userId, role: 'user', content: message },
    { user_id: userId, role: 'assistant', content: reply },
  ]);
  // The reply is still useful if persistence fails, so log rather than fail.
  if (saveError) logger.error({ err: saveError, userId }, 'Failed to persist chat history');

  res.json({ reply });
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
