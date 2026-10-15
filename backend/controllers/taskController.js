const { z } = require('zod');
const supabase = require('../supabaseClient');
const { HttpError } = require('../lib/errors');
const { validate, throwIfDbError } = require('../lib/validate');
const { optionalDate } = require('../lib/schemas');

const STATUS_VALUES = ['not_started', 'in_progress', 'stuck', 'done'];

const taskFields = {
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  due_date: optionalDate,
  course_code: z.string().max(50).optional(),
  grade_weight: z.number().min(0).max(100).optional(),
  estimated_hours: z.number().min(0).max(1000).optional(),
  priority_score: z.number().optional(),
};

const createTaskSchema = z.object({
  ...taskFields,
  status: z.enum(STATUS_VALUES).default('not_started'),
});

// Only the fields a client is allowed to change.
const updateTaskSchema = z
  .object({
    ...taskFields,
    title: taskFields.title.optional(),
    status: z.enum(STATUS_VALUES).optional(),
    ai_reasoning: z.string().max(5000).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

const NOT_FOUND = 'Task not found';

/** GET /api/tasks */
exports.getTasks = async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('due_date', { ascending: true });

  if (error) throw error;
  res.json(data);
};

/** GET /api/tasks/:id */
exports.getTaskById = async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  throwIfDbError(error, NOT_FOUND);
  res.json(data);
};

/** POST /api/tasks */
exports.createTask = async (req, res) => {
  const body = validate(createTaskSchema, req.body);
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...body, user_id: req.user.id }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
};

/** PATCH /api/tasks/:id */
exports.updateTask = async (req, res) => {
  const body = validate(updateTaskSchema, req.body);
  const { data, error } = await supabase
    .from('tasks')
    .update(body)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select();

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, NOT_FOUND);
  res.json(data[0]);
};

/** DELETE /api/tasks/:id */
exports.deleteTask = async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select();

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, NOT_FOUND);
  res.json({ message: 'Task deleted successfully', task: data[0] });
};

exports.schemas = { createTaskSchema, updateTaskSchema };
