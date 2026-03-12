const supabase = require('../supabaseClient');

// Get all tasks (filtered by user if user_id is provided)
exports.getTasks = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true });
      
    // If we have auth, we would get user_id from token
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

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Task not found' });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { 
      user_id, 
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
          user_id, // Should eventually come from authenticated user context
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

// Update an existing task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    res.json({ message: 'Task deleted successfully', task: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
