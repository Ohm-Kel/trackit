const supabase = require('../supabaseClient');

/**
 * GET /api/users/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userMeta = req.user.user_metadata || {};

    // 1. Try to fetch existing
    let { data, error } = await supabase
      .from('users')
      .select('display_name, email, avatar_url, university, course, year, weekly_schedule')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    // 2. If row doesn't exist, create it (auto-repair for missing rows)
    if (!data) {
      console.log(`User ${userId} not found in public.users, creating entry...`);
      const { data: newData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          display_name: userMeta.full_name || userMeta.name || userEmail.split('@')[0],
          avatar_url: userMeta.avatar_url || userMeta.picture,
        })
        .select('display_name, email, avatar_url, university, course, year, weekly_schedule')
        .single();

      if (insertError) throw insertError;
      data = newData;
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * PATCH /api/users/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Filter allowed fields to update
    const allowed = ['display_name', 'university', 'course', 'year', 'avatar_url'];
    const filteredUpdates = {};
    allowed.forEach(key => {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Use upsert to handle case where user might not exist yet
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...filteredUpdates,
        email: req.user.email // Ensure email is never lost/changed to empty
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
