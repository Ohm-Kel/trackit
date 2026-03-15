const supabase = require('../supabaseClient');

/**
 * GET /api/users/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userMeta = req.user.user_metadata || {};

    // 1. Try to fetch existing profile
    // We select * to be safe against schema mismatches, but we really want the core fields
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching profile:', error);
      return res.status(500).json({ 
        error: 'Database error fetching profile', 
        details: error.message 
      });
    }

    // 2. If row doesn't exist, create it (auto-repair for missing rows)
    if (!data) {
      console.log(`User ${userId} not found in public.users table, creating entry...`);
      const { data: newData, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          display_name: userMeta.full_name || userMeta.name || userEmail.split('@')[0],
          avatar_url: userMeta.avatar_url || userMeta.picture,
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Supabase error inserting profile:', insertError);
        return res.status(500).json({ 
          error: 'Failed to create user profile entry', 
          details: insertError.message 
        });
      }
      data = newData;
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error in getProfile:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
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

    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: userId,
        ...filteredUpdates,
        email: req.user.email
      })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Unexpected error in updateProfile:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
