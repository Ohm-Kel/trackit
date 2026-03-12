const supabase = require('../supabaseClient');

// Get all tasks for the authenticated user
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single task by ID for the authenticated user
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Task not found or unauthorized' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new task for the authenticated user
exports.createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, 
      description, 
      due_date, 
      course_code, 
      grade_weight, 
      estimated_hours, 
      priority_score,
      status 
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          user_id: userId,
          title, 
          description, 
          due_date, 
          course_code, 
          grade_weight, 
          estimated_hours, 
          priority_score,
          status: status || 'Not started'
        }
      ])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an existing task for the authenticated user
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Remove user_id from updates to prevent hijacking
    delete updates.user_id;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Task not found or unauthorized' });
    
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a task for the authenticated user
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Task not found or unauthorized' });
    
    res.json({ message: 'Task deleted successfully', task: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
