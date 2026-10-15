const { HttpError } = require('../lib/errors');
const { parseId } = require('../lib/validate');

const URGENT_WINDOW_MS = 4 * 24 * 60 * 60 * 1000;
const HIGH_WORKLOAD_THRESHOLD = 3;

/**
 * Build a workload notification from a user's open tasks, or null when none is
 * needed: an alert for 3+ deadlines in the next 4 days, otherwise a reminder
 * for the nearest one.
 * @param {string} userId
 * @param {{ title: string, due_date: string | null }[]} openTasks Sorted by due_date.
 * @param {Date} [now]
 */
function buildSuggestion(userId, openTasks, now = new Date()) {
  const windowEnd = now.getTime() + URGENT_WINDOW_MS;
  const urgent = openTasks.filter((task) => {
    if (!task.due_date) return false;
    const due = new Date(task.due_date).getTime();
    return due >= now.getTime() && due <= windowEnd;
  });

  if (urgent.length >= HIGH_WORKLOAD_THRESHOLD) {
    return {
      user_id: userId,
      type: 'ai_suggestion',
      message: `High Workload Alert! You have ${urgent.length} tasks due in the next 4 days. Would you like me to help you create a Focus Plan for today?`,
      read_status: false,
    };
  }
  if (urgent.length > 0) {
    return {
      user_id: userId,
      type: 'info',
      message: `Gentle reminder: "${urgent[0].title}" is due soon. Aim to finish it today to stay ahead!`,
      read_status: false,
    };
  }
  return null;
}

/** GET /api/notifications */
exports.getNotifications = async (req, res) => {
  const { data, error } = await req.db
    .from('notifications')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  res.json(data);
};

/** PATCH /api/notifications/:id/read */
exports.markAsRead = async (req, res) => {
  const id = parseId(req.params.id, 'Notification not found');
  const { data, error } = await req.db
    .from('notifications')
    .update({ read_status: true })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select('id');

  if (error) throw error;
  if (data.length === 0) throw new HttpError(404, 'Notification not found');
  res.json({ message: 'Notification marked as read' });
};

/** PATCH /api/notifications/read-all */
exports.markAllAsRead = async (req, res) => {
  const { error } = await req.db
    .from('notifications')
    .update({ read_status: true })
    .eq('user_id', req.user.id)
    .eq('read_status', false);

  if (error) throw error;
  res.json({ message: 'All notifications marked as read' });
};

/** POST /api/notifications/generate-suggestions */
exports.generateSuggestions = async (req, res) => {
  const userId = req.user.id;
  const { data: tasks, error } = await req.db
    .from('tasks')
    .select('title, due_date')
    .eq('user_id', userId)
    .neq('status', 'done')
    .order('due_date', { ascending: true });

  if (error) throw error;

  const suggestion = buildSuggestion(userId, tasks);
  if (!suggestion) return res.json({ message: 'No new suggestions needed at this time' });

  // Avoid stacking identical unread suggestions.
  const { data: existing, error: existingError } = await req.db
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('message', suggestion.message)
    .eq('read_status', false)
    .limit(1);

  if (existingError) throw existingError;
  if (existing.length > 0) return res.json({ message: 'No new suggestions needed at this time' });

  const { error: insertError } = await req.db.from('notifications').insert(suggestion);
  if (insertError) throw insertError;
  return res.json({ message: 'Suggestion generated', suggestion });
};

exports.buildSuggestion = buildSuggestion;
