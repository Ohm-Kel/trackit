const supabase = require('../supabaseClient');

/**
 * GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error in getNotifications:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Supabase error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to update notification', details: error.message });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Unexpected error in markAsRead:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * PATCH /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true })
      .eq('user_id', req.user.id)
      .eq('read_status', false);

    if (error) {
      console.error('Supabase error marking all as read:', error);
      return res.status(500).json({ error: 'Failed to update notifications', details: error.message });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Unexpected error in markAllAsRead:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

/**
 * POST /api/notifications/generate-suggestions
 * Proactive AI-driven suggestions based on task density
 */
exports.generateSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. Fetch upcoming incomplete tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'done')
      .order('due_date', { ascending: true });

    if (tasksError) throw tasksError;

    // 2. Analyze density (tasks due in next 4 days)
    const now = new Date();
    const fourDaysLater = new Date();
    fourDaysLater.setDate(now.getDate() + 4);

    const urgentTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate <= fourDaysLater && dueDate >= now;
    });

    let suggestion = null;

    if (urgentTasks.length >= 3) {
      suggestion = {
        user_id: userId,
        type: 'ai_suggestion',
        message: `High Workload Alert! You have ${urgentTasks.length} tasks due in the next 4 days. Would you like me to help you create a Focus Plan for today?`,
        read_status: false
      };
    } else if (urgentTasks.length > 0 && urgentTasks.length < 3) {
       // Check for specific upcoming deadlines
       const nearest = urgentTasks[0];
       suggestion = {
         user_id: userId,
         type: 'info',
         message: `Gentle reminder: "${nearest.title}" is due soon. Aim to finish it today to stay ahead!`,
         read_status: false
       };
    }

    if (suggestion) {
      // Avoid duplicate recent identical suggestions
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('message', suggestion.message)
        .eq('read_status', false)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('notifications').insert(suggestion);
        return res.json({ message: 'Suggestion generated', suggestion });
      }
    }

    res.json({ message: 'No new suggestions needed at this time' });
  } catch (err) {
    console.error('Error in generateSuggestions:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};
