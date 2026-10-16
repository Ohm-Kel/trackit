const { z } = require('zod');
const { HttpError } = require('../lib/errors');
const { validate, throwIfDbError, parseId } = require('../lib/validate');

const createSubtaskSchema = z
  .object({
    task_id: z.uuid().optional(),
    exam_id: z.uuid().optional(),
    title: z.string().trim().min(1, 'Title is required').max(200),
    estimated_hours: z.number().min(0).max(1000).optional(),
    order_index: z.number().int().min(0).optional(),
  })
  .refine((body) => Boolean(body.task_id) !== Boolean(body.exam_id), {
    message: 'Provide either task_id or exam_id, not both',
  });

const updateSubtaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    status: z.enum(['not_started', 'done']).optional(),
    estimated_hours: z.number().min(0).max(1000).optional(),
    order_index: z.number().int().min(0).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

const listQuerySchema = z.object({
  task_id: z.uuid().optional(),
  exam_id: z.uuid().optional(),
});

const NOT_FOUND = 'Subtask not found';

/**
 * Confirm the parent task or exam belongs to the user. RLS on subtasks only
 * checks the subtask's own user_id, so without this a user could attach
 * subtasks to another user's record by guessing its id.
 */
async function assertParentOwned(db, userId, { task_id: taskId, exam_id: examId }) {
  const table = taskId ? 'tasks' : 'exams';
  const { data, error } = await db
    .from(table)
    .select('id')
    .eq('id', taskId || examId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new HttpError(404, taskId ? 'Task not found' : 'Exam not found');
}

/** GET /api/subtasks?task_id=… or ?exam_id=… */
exports.getSubtasks = async (req, res) => {
  const { task_id: taskId, exam_id: examId } = validate(listQuerySchema, req.query);

  let query = req.db
    .from('subtasks')
    .select('*')
    .eq('user_id', req.user.id)
    .order('order_index', { ascending: true });

  if (taskId) query = query.eq('task_id', taskId);
  if (examId) query = query.eq('exam_id', examId);

  const { data, error } = await query;
  if (error) throw error;
  res.json(data);
};

/** POST /api/subtasks */
exports.createSubtask = async (req, res) => {
  const body = validate(createSubtaskSchema, req.body);
  await assertParentOwned(req.db, req.user.id, body);

  const { data, error } = await req.db
    .from('subtasks')
    .insert({ ...body, user_id: req.user.id })
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
};

/** PATCH /api/subtasks/:id */
exports.updateSubtask = async (req, res) => {
  const id = parseId(req.params.id, NOT_FOUND);
  const body = validate(updateSubtaskSchema, req.body);
  const { data, error } = await req.db
    .from('subtasks')
    .update(body)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  throwIfDbError(error, NOT_FOUND);
  res.json(data);
};

/** DELETE /api/subtasks/:id */
exports.deleteSubtask = async (req, res) => {
  const id = parseId(req.params.id, NOT_FOUND);
  const { data, error } = await req.db
    .from('subtasks')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('id');

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, NOT_FOUND);
  res.json({ success: true });
};

exports.schemas = { createSubtaskSchema, updateSubtaskSchema };
