import { useMemo } from 'react';
import { BarChart2, TrendingUp, Clock, Award, Loader2 } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary', bg = 'bg-primary-light' }) {
  return (
    <div className="bg-white border border-border rounded-r p-4 md:p-5 shadow-xs flex items-center gap-3 md:gap-4">
      <div className={`w-[38px] h-[38px] md:w-[44px] md:h-[44px] rounded-[11px] ${bg} flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" strokeWidth={1.8} />
      </div>
      <div>
        <div className="text-[24px] md:text-[28px] font-bold text-text-1 leading-none">{value}</div>
        <div className="text-[12px] text-text-3 font-medium mt-0.5">{label}</div>
        {sub && <div className="text-[11px] text-text-3 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// Simple SVG bar chart — no dependency needed
function SimpleBarChart({ data, maxVal, color = '#4F46E5' }) {
  if (!data.length) return <div className="text-[13px] text-text-3 text-center py-4">No data yet</div>;
  return (
    <div className="flex items-end gap-2 h-[100px] md:h-[130px] w-full">
      {data.map(({ label, value }, i) => {
        const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-primary">{value || ''}</div>
            <div className="w-full flex items-end justify-center flex-1">
              <div
                className="w-full rounded-t-[4px] transition-all duration-500"
                style={{ height: `${Math.max(pct, value > 0 ? 4 : 0)}%`, backgroundColor: color, opacity: 0.85 }}
              />
            </div>
            <div className="text-[9px] text-text-3 font-medium text-center truncate w-full">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function ProgressRow({ label, value, max, color = 'bg-primary' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-[12.5px] text-text-2 mb-1">
        <span className="font-medium truncate mr-2">{label}</span>
        <span className="font-semibold shrink-0">{pct}%</span>
      </div>
      <div className="h-[6px] bg-bg rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-[width] duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: exams = [], isLoading: examsLoading } = useExams();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const notStarted = tasks.filter(t => !t.status || t.status === 'not_started').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    const totalHours = tasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
    const completedHours = tasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.estimated_hours || 0), 0);
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, notStarted, overdue, totalHours, completedHours, completionRate };
  }, [tasks]);

  // Tasks by course code
  const byCourse = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const key = t.course_code || 'Uncategorised';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [tasks]);

  const maxByCourse = Math.max(...byCourse.map(d => d.value), 1);

  // Tasks by status distribution
  const statusDist = [
    { label: 'Done', value: stats.done, color: 'bg-[#16A34A]' },
    { label: 'In Progress', value: stats.inProgress, color: 'bg-primary' },
    { label: 'Not Started', value: stats.notStarted, color: 'bg-text-3' },
    { label: 'Overdue', value: stats.overdue, color: 'bg-[#EF4444]' },
  ].filter(d => d.value > 0);

  // Exam prep averages
  const examPrep = useMemo(() => exams
    .filter(e => {
      const diff = Math.ceil((new Date(e.exam_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
      return diff >= 0;
    })
    .map(e => ({ label: e.subject, value: e.preparation_percent ?? 0 }))
    .sort((a, b) => a.value - b.value), [exams]);

  const isLoading = tasksLoading || examsLoading;

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Analytics</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">A breakdown of your workload, progress, and study habits</p>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-text-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[13px]">Calculating your stats…</span>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <StatCard icon={BarChart2} label="Total Tasks" value={stats.total} />
              <StatCard icon={TrendingUp} label="Completion Rate" value={`${stats.completionRate}%`} sub={`${stats.done} of ${stats.total} done`} />
              <StatCard icon={Clock} label="Hours of Work" value={stats.totalHours} sub={`${stats.completedHours} hrs completed`} color="text-[#D97706]" bg="bg-[#FFFBEB]" />
              <StatCard icon={Award} label="Exams Tracked" value={exams.length} sub={`${examPrep.length} upcoming`} color="text-[#16A34A]" bg="bg-[#F0FDF4]" />
            </div>

            {/* Overdue Alert */}
            {stats.overdue > 0 && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-r p-4 mb-5 flex items-start gap-3">
                <span className="text-[20px] shrink-0">⚠️</span>
                <div>
                  <div className="text-[13px] font-bold text-[#991B1B] mb-0.5">You have {stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''}</div>
                  <div className="text-[12.5px] text-[#7F1D1D]">These tasks passed their due date without being completed. Review them on the Tasks page.</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              {/* Tasks by Course */}
              <div className="bg-white border border-border rounded-r p-4 md:p-5 shadow-xs">
                <div className="text-[13px] font-bold text-text-1 mb-4">Tasks by Course</div>
                {byCourse.length === 0 ? (
                  <div className="text-[13px] text-text-3 text-center py-6 italic">No tasks with course codes yet</div>
                ) : (
                  <SimpleBarChart data={byCourse} maxVal={maxByCourse} />
                )}
              </div>

              {/* Status Distribution */}
              <div className="bg-white border border-border rounded-r p-4 md:p-5 shadow-xs">
                <div className="text-[13px] font-bold text-text-1 mb-4">Status Breakdown</div>
                {stats.total === 0 ? (
                  <div className="text-[13px] text-text-3 text-center py-6 italic">No tasks tracked yet</div>
                ) : (
                  <>
                    {/* Visual donut-style bar */}
                    <div className="flex h-[10px] rounded-full overflow-hidden mb-4 gap-[2px]">
                      {statusDist.map(({ label, value, color }) => (
                        <div
                          key={label}
                          className={`${color} h-full transition-[flex] duration-700 first:rounded-l-full last:rounded-r-full`}
                          style={{ flex: value }}
                          title={`${label}: ${value}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-2.5">
                      {statusDist.map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between text-[12.5px]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                            <span className="text-text-2 font-medium">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-1 font-bold">{value}</span>
                            <span className="text-text-3 text-[11.5px]">({Math.round((value / stats.total) * 100)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Exam Preparation */}
            {examPrep.length > 0 && (
              <div className="bg-white border border-border rounded-r p-4 md:p-5 shadow-xs mb-5">
                <div className="text-[13px] font-bold text-text-1 mb-4">Exam Preparation Progress</div>
                {examPrep.map(({ label, value }) => (
                  <ProgressRow
                    key={label}
                    label={label}
                    value={value}
                    max={100}
                    color={value < 30 ? 'bg-[#EF4444]' : value < 60 ? 'bg-[#D97706]' : 'bg-[#16A34A]'}
                  />
                ))}
              </div>
            )}

            {/* Workload Summary */}
            <div className="bg-white border border-border rounded-r p-4 md:p-5 shadow-xs">
              <div className="text-[13px] font-bold text-text-1 mb-4">Workload Insights</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-bg rounded-r p-3.5 border border-border">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-1.5">Avg. Effort / Task</div>
                  <div className="text-[22px] font-bold text-text-1">
                    {stats.total > 0 ? (stats.totalHours / stats.total).toFixed(1) : '—'}
                    <span className="text-[13px] font-medium text-text-3 ml-1">hrs</span>
                  </div>
                </div>
                <div className="bg-bg rounded-r p-3.5 border border-border">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-1.5">In Progress</div>
                  <div className="text-[22px] font-bold text-text-1">
                    {stats.inProgress}
                    <span className="text-[13px] font-medium text-text-3 ml-1">tasks</span>
                  </div>
                </div>
                <div className="bg-bg rounded-r p-3.5 border border-border">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-1.5">Hours Remaining</div>
                  <div className="text-[22px] font-bold text-text-1">
                    {stats.totalHours - stats.completedHours}
                    <span className="text-[13px] font-medium text-text-3 ml-1">hrs</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
