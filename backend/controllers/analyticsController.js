const { computeVelocity, findBurnoutZones } = require('../lib/analytics');

/** GET /api/analytics/velocity — tasks completed per week over the last 4 weeks. */
exports.getStudyVelocity = async (req, res) => {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const { data, error } = await req.db
    .from('tasks')
    .select('completed_at')
    .eq('user_id', req.user.id)
    .eq('status', 'done')
    .gte('completed_at', since.toISOString());

  if (error) throw error;
  res.json(computeVelocity(data));
};

/** GET /api/analytics/burnout — clusters of 3+ open deadlines within 48 hours. */
exports.getBurnoutAnalysis = async (req, res) => {
  const { data, error } = await req.db
    .from('tasks')
    .select('id, title, due_date')
    .eq('user_id', req.user.id)
    .neq('status', 'done')
    .order('due_date', { ascending: true });

  if (error) throw error;
  res.json(findBurnoutZones(data));
};
