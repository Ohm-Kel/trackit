const { z } = require('zod');
const supabase = require('../supabaseClient');

// ── Zod schemas ──────────────────────────────────────────────────────────────

const STATUS_VALUES = ['not_started', 'in_progress', 'stuck', 'done'];

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  course_code: z.string().optional(),
  grade_weight: z.number().min(0).max(100).optional(),
  estimated_hours: z.number().min(0).optional(),
  priority_score: z.number().optional(),
  status: z.enum(STATUS_VALUES).default('not_started'),
});

// Only the fields a client is allowed to change
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  due_date: z.string().optional(),
  course_code: z.string().optional(),
  grade_weight: z.number().min(0).max(100).optional(),
  estimated_hours: z.number().min(0).optional(),
  priority_score: z.number().optional(),
  status: z.enum(STATUS_VALUES).optional(),
  ai_reasoning: z.string().optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function validationError(res, issues) {
  return res.status(400).json({ error: issues[0]?.message || 'Validation error' });
}

// ── Controllers ──────────────────────────────────────────────────────────────

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('due_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      // PGRST116 = "The result contains 0 rows" (Supabase PostgREST code)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Task not found or unauthorized' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.issues);

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ user_id: req.user.id, ...parsed.data }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.issues);

    const { data, error } = await supabase
      .from('tasks')
      .update(parsed.data)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully', task: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
