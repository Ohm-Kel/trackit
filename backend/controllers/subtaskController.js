const { z } = require('zod');
const supabase = require('../supabaseClient');

const createSubtaskSchema = z.object({
  task_id: z.string().uuid().optional(),
  exam_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  estimated_hours: z.number().min(0).optional(),
  order_index: z.number().int().min(0).optional(),
}).refine(
  (d) => (d.task_id && !d.exam_id) || (!d.task_id && d.exam_id),
  { message: 'Provide either task_id or exam_id, not both' }
);

const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['not_started', 'done']).optional(),
  estimated_hours: z.number().min(0).optional(),
  order_index: z.number().int().min(0).optional(),
});

// GET /api/subtasks?task_id=xxx or ?exam_id=xxx
exports.getSubtasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { task_id, exam_id } = req.query;

    let query = supabase
      .from('subtasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (task_id) query = query.eq('task_id', task_id);
    if (exam_id) query = query.eq('exam_id', exam_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subtasks.' });
  }
};

// POST /api/subtasks
exports.createSubtask = async (req, res) => {
  try {
    const parsed = createSubtaskSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('subtasks')
      .insert({ ...parsed, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    res.status(500).json({ error: 'Failed to create subtask.' });
  }
};

// PATCH /api/subtasks/:id
exports.updateSubtask = async (req, res) => {
  try {
    const parsed = updateSubtaskSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('subtasks')
      .update(parsed)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Subtask not found.' });
      throw error;
    }
    res.json(data);
  } catch (err) {
    if (err.issues) return res.status(400).json({ error: err.issues[0].message });
    res.status(500).json({ error: 'Failed to update subtask.' });
  }
};

// DELETE /api/subtasks/:id
exports.deleteSubtask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete subtask.' });
  }
};
