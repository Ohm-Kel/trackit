const { z } = require('zod');
const logger = require('../lib/logger');
const { validate } = require('../lib/validate');

const updateProfileSchema = z.object({
  display_name: z.string().trim().max(100).optional(),
  university: z.string().max(200).nullable().optional(),
  course: z.string().max(200).nullable().optional(),
  year: z.string().max(50).nullable().optional(),
  avatar_url: z.url().max(2000).nullable().optional().or(z.literal('')),
});

/** GET /api/users/profile — returns the profile, creating it on first access. */
exports.getProfile = async (req, res) => {
  const { id: userId, email } = req.user;
  const meta = req.user.user_metadata || {};

  const { data, error } = await req.db.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (data) return res.json(data);

  // The auth trigger normally creates this row; repair it if it is missing.
  logger.info({ userId }, 'Creating missing profile row');
  const { data: created, error: insertError } = await req.db
    .from('users')
    .insert({
      id: userId,
      email,
      display_name: meta.full_name || meta.name || email.split('@')[0],
      avatar_url: meta.avatar_url || meta.picture || null,
    })
    .select('*')
    .single();

  if (insertError) throw insertError;
  return res.json(created);
};

/** PATCH /api/users/profile */
exports.updateProfile = async (req, res) => {
  const updates = validate(updateProfileSchema, req.body);
  const { data, error } = await req.db
    .from('users')
    .upsert({ ...updates, id: req.user.id, email: req.user.email })
    .select('*')
    .single();

  if (error) throw error;
  res.json(data);
};

exports.schemas = { updateProfileSchema };
