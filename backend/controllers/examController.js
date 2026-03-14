const { z } = require('zod');
const supabase = require('../supabaseClient');

// ── Zod schemas ──────────────────────────────────────────────────────────────

const CONFIDENCE_VALUES = ['low', 'medium', 'high'];

const createExamSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  course_code: z.string().optional(),
  exam_date: z.string().optional(),
  confidence_level: z.enum(CONFIDENCE_VALUES).default('medium'),
  daily_study_hours: z.number().min(0).optional(),
  preparation_percent: z.number().min(0).max(100).optional(),
  topics: z.array(z.string()).default([]),
});

// Only the fields a client is allowed to change
const updateExamSchema = z.object({
  subject: z.string().min(1).optional(),
  course_code: z.string().optional(),
  exam_date: z.string().optional(),
  confidence_level: z.enum(CONFIDENCE_VALUES).optional(),
  daily_study_hours: z.number().min(0).optional(),
  preparation_percent: z.number().min(0).max(100).optional(),
  topics: z.array(z.string()).optional(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function validationError(res, issues) {
  return res.status(400).json({ error: issues[0]?.message || 'Validation error' });
}

// ── Controllers ──────────────────────────────────────────────────────────────

// GET /api/exams
exports.getExams = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', req.user.id)
      .order('exam_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/exams/:id
exports.getExamById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      // PGRST116 = "The result contains 0 rows"
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Exam not found or unauthorized' });
      }
      throw error;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/exams
exports.createExam = async (req, res) => {
  try {
    const parsed = createExamSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.issues);

    const { data, error } = await supabase
      .from('exams')
      .insert([{ user_id: req.user.id, ...parsed.data }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/exams/:id
exports.updateExam = async (req, res) => {
  try {
    const parsed = updateExamSchema.safeParse(req.body);
    if (!parsed.success) return validationError(res, parsed.error.issues);

    const { data, error } = await supabase
      .from('exams')
      .update(parsed.data)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Exam not found or unauthorized' });
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;
    if (data.length === 0) {
      return res.status(404).json({ error: 'Exam not found or unauthorized' });
    }

    res.json({ message: 'Exam deleted successfully', exam: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
