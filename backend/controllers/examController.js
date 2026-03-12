const supabase = require('../supabaseClient');

// Get all exams (filtered by user if user_id is provided)
exports.getExams = async (req, res) => {
  try {
    const { user_id } = req.query;

    let query = supabase
      .from('exams')
      .select('*')
      .order('exam_date', { ascending: true });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single exam by ID
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Exam not found' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new exam
exports.createExam = async (req, res) => {
  try {
    const {
      user_id,
      subject,
      course_code,
      exam_date,
      exam_time,
      venue,
      confidence_level,
      daily_study_hours,
      topics
    } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const { data, error } = await supabase
      .from('exams')
      .insert([{
        user_id,
        subject,
        course_code,
        exam_date,
        exam_time,
        venue,
        confidence_level: confidence_level || 'medium',
        daily_study_hours,
        topics: topics || []
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an existing exam
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Exam not found' });

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an exam
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Exam not found' });

    res.json({ message: 'Exam deleted successfully', exam: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
