const supabase = require('../supabaseClient');

// Get all exams for the authenticated user
exports.getExams = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .order('exam_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single exam by ID for the authenticated user
exports.getExamById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Exam not found or unauthorized' });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new exam for the authenticated user
exports.createExam = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
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
        user_id: userId,
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

// Update an existing exam for the authenticated user
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Prevent hijacking
    delete updates.user_id;

    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Exam not found or unauthorized' });

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an exam for the authenticated user
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Exam not found or unauthorized' });

    res.json({ message: 'Exam deleted successfully', exam: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
