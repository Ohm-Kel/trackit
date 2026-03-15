const supabase = require('../supabaseClient');

/**
 * GET /api/analytics/velocity
 * Calculates tasks completed per week for the last 4 weeks
 */
exports.getStudyVelocity = async (req, res) => {
  try {
    const userId = req.user.id;
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', fourWeeksAgo.toISOString());

    if (error) throw error;

    // Aggregate by week
    const velocityMap = {};
    // Initialize weeks
    for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const weekKey = `Week of ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
        velocityMap[weekKey] = 0;
    }

    tasks.forEach(task => {
        const date = new Date(task.completed_at);
        // Simplified grouping for MVP
        const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);
        if (weekIndex >= 0 && weekIndex < 4) {
             const d = new Date();
             d.setDate(d.getDate() - (weekIndex * 7));
             const weekKey = `Week of ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
             velocityMap[weekKey]++;
        }
    });

    const report = Object.entries(velocityMap).map(([name, tasks]) => ({ name, tasks })).reverse();
    res.json(report);
  } catch (err) {
    console.error('Error fetching study velocity:', err);
    res.status(500).json({ error: 'Failed to calculate study velocity' });
  }
};

/**
 * GET /api/analytics/burnout
 * Identifies high-density deadline clusters (3+ tasks in 48h)
 */
exports.getBurnoutAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('user_id', userId)
      .neq('status', 'done')
      .order('due_date', { ascending: true });

    if (error) throw error;

    const burnoutZones = [];
    for (let i = 0; i < tasks.length; i++) {
        const current = tasks[i];
        if (!current.due_date) continue;

        const cluster = [current];
        const currentStart = new Date(current.due_date);
        const windowEnd = new Date(currentStart.getTime() + (48 * 60 * 60 * 1000));

        for (let j = i + 1; j < tasks.length; j++) {
            const next = tasks[j];
            if (!next.due_date) continue;
            const nextDate = new Date(next.due_date);
            if (nextDate <= windowEnd) {
                cluster.push(next);
            } else {
                break;
            }
        }

        if (cluster.length >= 3) {
            burnoutZones.push({
                start_date: current.due_date,
                task_count: cluster.length,
                tasks: cluster.map(t => t.title)
            });
            // Skip indices already in this cluster to avoid overlapping report items
            i += cluster.length - 1;
        }
    }

    res.json(burnoutZones);
  } catch (err) {
    console.error('Error fetching burnout analysis:', err);
    res.status(500).json({ error: 'Failed to analyze burnout risk' });
  }
};
