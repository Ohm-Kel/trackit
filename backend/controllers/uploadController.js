const { z } = require('zod');
const anthropic = require('../lib/anthropic');
const config = require('../config');
const logger = require('../lib/logger');
const { HttpError, fromAnthropicError } = require('../lib/errors');
const { validate } = require('../lib/validate');
const { optionalDate } = require('../lib/schemas');
const {
  parseTimetable,
  weeklyScheduleSchema,
  SUPPORTED_MEDIA_TYPES,
} = require('../lib/timetableParser');

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

const parseRequestSchema = z.object({
  file: z
    .string()
    .min(1, 'File data is required')
    .max(config.upload.maxBase64Chars, 'File is too large. The limit is about 6 MB.')
    .regex(BASE64_RE, 'File must be base64-encoded without a data: prefix'),
  mimeType: z.enum(Object.keys(SUPPORTED_MEDIA_TYPES), {
    error: 'Unsupported file type. Use PDF, PNG, JPG or WebP.',
  }),
  type: z.enum(['exam', 'schedule']).default('exam'),
});

// Users can edit parsed rows before importing, so accept what the form sends.
const importExamsSchema = z.object({
  exams: z
    .array(
      z.object({
        subject: z.string().trim().min(1, 'Every exam needs a subject').max(200),
        course_code: z.string().max(50).nullable().optional(),
        exam_date: optionalDate,
      }),
    )
    .min(1, 'No exams to import')
    .max(200),
});

const saveScheduleSchema = z.object({ schedule: weeklyScheduleSchema });

/**
 * POST /api/upload/parse
 * Body: { file: base64, mimeType, type: 'exam' | 'schedule' }
 */
exports.parseUpload = async (req, res) => {
  const { file, mimeType, type } = validate(parseRequestSchema, req.body);

  let result;
  try {
    result = await parseTimetable({
      client: anthropic,
      model: config.anthropicModel,
      fileBase64: file,
      mimeType,
      type,
    });
  } catch (err) {
    logger.error({ err, userId: req.user.id, type }, 'Timetable parsing failed');
    throw fromAnthropicError(err);
  }

  logger.info(
    {
      userId: req.user.id,
      type,
      dropped: result.dropped,
      truncated: result.truncated,
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens,
    },
    'timetable parsed',
  );

  const warnings = [];
  if (result.dropped > 0) {
    warnings.push(
      `${result.dropped} entr${result.dropped === 1 ? 'y was' : 'ies were'} unreadable and skipped.`,
    );
  }
  if (result.truncated) {
    warnings.push('The timetable is long, so some entries at the end may be missing.');
  }

  res.json({ type, data: result.data, warnings });
};

/**
 * POST /api/upload/import-exams
 * Body: { exams: [{ subject, course_code?, exam_date? }] }
 */
exports.importExams = async (req, res) => {
  const { exams } = validate(importExamsSchema, req.body);

  const rows = exams.map((exam) => ({
    user_id: req.user.id,
    subject: exam.subject,
    course_code: exam.course_code || null,
    exam_date: exam.exam_date || null,
    confidence_level: 'medium',
    preparation_percent: 0,
    topics: [],
  }));

  const { data, error } = await req.db.from('exams').insert(rows).select();
  if (error) throw error;
  res.status(201).json({ imported: data.length, exams: data });
};

/**
 * POST /api/upload/save-schedule
 * Body: { schedule: { monday: [...], ..., sunday: [...] } }
 */
exports.saveSchedule = async (req, res) => {
  const { schedule } = validate(saveScheduleSchema, req.body);

  const { data, error } = await req.db
    .from('users')
    .update({ weekly_schedule: schedule })
    .eq('id', req.user.id)
    .select('id');

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, 'Profile not found');
  res.json({ success: true });
};

exports.schemas = { parseRequestSchema, importExamsSchema, saveScheduleSchema };
