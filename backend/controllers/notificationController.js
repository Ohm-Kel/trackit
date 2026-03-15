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
