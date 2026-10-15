const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 4;
const BURNOUT_WINDOW_MS = 48 * 60 * 60 * 1000;
const BURNOUT_MIN_TASKS = 3;

function weekLabel(now, weekIndex) {
  const date = new Date(now.getTime() - weekIndex * 7 * DAY_MS);
  return `Week of ${date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
}

/**
 * Count tasks completed in each of the last four 7-day windows.
 * @param {{ completed_at: string | null }[]} tasks Completed tasks.
 * @param {Date} [now]
 * @returns {{ name: string, tasks: number }[]} Oldest week first.
 */
function computeVelocity(tasks, now = new Date()) {
  const counts = new Array(WEEKS).fill(0);

  for (const task of tasks) {
    if (!task.completed_at) continue;
    const ageDays = Math.floor((now - new Date(task.completed_at)) / DAY_MS);
    const weekIndex = Math.floor(ageDays / 7);
    if (weekIndex >= 0 && weekIndex < WEEKS) counts[weekIndex] += 1;
  }

  return counts.map((count, index) => ({ name: weekLabel(now, index), tasks: count })).reverse();
}

/**
 * Find clusters of three or more deadlines falling within 48 hours of the
 * first deadline in the cluster. Clusters do not overlap.
 * @param {{ title: string, due_date: string | null }[]} tasks Sorted by due_date ascending.
 * @returns {{ start_date: string, task_count: number, tasks: string[] }[]}
 */
function findBurnoutZones(tasks) {
  const dated = tasks.filter((task) => task.due_date);
  const zones = [];

  for (let i = 0; i < dated.length; i += 1) {
    const windowEnd = new Date(dated[i].due_date).getTime() + BURNOUT_WINDOW_MS;
    let j = i;
    while (j + 1 < dated.length && new Date(dated[j + 1].due_date).getTime() <= windowEnd) {
      j += 1;
    }

    const cluster = dated.slice(i, j + 1);
    if (cluster.length >= BURNOUT_MIN_TASKS) {
      zones.push({
        start_date: dated[i].due_date,
        task_count: cluster.length,
        tasks: cluster.map((task) => task.title),
      });
      i = j;
    }
  }

  return zones;
}

module.exports = { computeVelocity, findBurnoutZones };
