const { z } = require('zod');
const { HttpError } = require('../lib/errors');
const { validate, throwIfDbError, parseId } = require('../lib/validate');
const { optionalDate } = require('../lib/schemas');

const CONFIDENCE_VALUES = ['low', 'medium', 'high'];

const examFields = {
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  course_code: z.string().max(50).optional(),
  exam_date: optionalDate,
  daily_study_hours: z.number().min(0).max(24).optional(),
  preparation_percent: z.number().min(0).max(100).optional(),
};

const createExamSchema = z.object({
  ...examFields,
  confidence_level: z.enum(CONFIDENCE_VALUES).default('medium'),
  topics: z.array(z.string().max(200)).max(100).default([]),
});

// Only the fields a client is allowed to change.
const updateExamSchema = z
  .object({
    ...examFields,
    subject: examFields.subject.optional(),
    confidence_level: z.enum(CONFIDENCE_VALUES).optional(),
    topics: z.array(z.string().max(200)).max(100).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

const NOT_FOUND = 'Exam not found';

/** GET /api/exams */
exports.getExams = async (req, res) => {
  const { data, error } = await req.db
    .from('exams')
    .select('*')
    .eq('user_id', req.user.id)
    .order('exam_date', { ascending: true });

  if (error) throw error;
  res.json(data);
};

/** GET /api/exams/:id */
exports.getExamById = async (req, res) => {
  const id = parseId(req.params.id, NOT_FOUND);
  const { data, error } = await req.db
    .from('exams')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  throwIfDbError(error, NOT_FOUND);
  res.json(data);
};

/** POST /api/exams */
exports.createExam = async (req, res) => {
  const body = validate(createExamSchema, req.body);
  const { data, error } = await req.db
    .from('exams')
    .insert([{ ...body, user_id: req.user.id }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
};

/** PATCH /api/exams/:id */
exports.updateExam = async (req, res) => {
  const id = parseId(req.params.id, NOT_FOUND);
  const body = validate(updateExamSchema, req.body);
  const { data, error } = await req.db
    .from('exams')
    .update(body)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, NOT_FOUND);
  res.json(data[0]);
};

/** DELETE /api/exams/:id */
exports.deleteExam = async (req, res) => {
  const id = parseId(req.params.id, NOT_FOUND);
  const { data, error } = await req.db
    .from('exams')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select();

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, NOT_FOUND);
  res.json({ message: 'Exam deleted successfully', exam: data[0] });
};

exports.schemas = { createExamSchema, updateExamSchema };
