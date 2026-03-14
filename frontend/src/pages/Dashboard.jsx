import { useMemo } from 'react';
import { Plus, ListTodo, CalendarDays, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';
import { daysUntil, formatRelativeDate, getDueBadgeClass, formatStatus } from '../utils/dates';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: exams = [], isLoading: examsLoading } = useExams();

  const profile = JSON.parse(localStorage.getItem('trackit_profile') || '{}');
  const firstName = profile.name ? profile.name.split(' ')[0] : 'there';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const activeTasks = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks]);
  const dueThisWeek = useMemo(() => activeTasks.filter(t => {
    const d = daysUntil(t.due_date);
    return d !== null && d >= 0 && d <= 7;
  }), [activeTasks]);
  const urgentTasks = useMemo(() => activeTasks.filter(t => {
    const d = daysUntil(t.due_date);
    return d !== null && d <= 1;
  }), [activeTasks]);

  const upcomingExams = useMemo(() => exams.filter(e => daysUntil(e.exam_date) >= 0), [exams]);

  const priorityQueue = useMemo(() => {
    return [...activeTasks]
      .sort((a, b) => {
        const dA = daysUntil(a.due_date) ?? 999;
        const dB = daysUntil(b.due_date) ?? 999;
        if (dA !== dB) return dA - dB;
        return (b.grade_weight || 0) - (a.grade_weight || 0);
      })
      .slice(0, 3);
  }, [activeTasks]);

  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  if (tasksLoading && examsLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">{greeting}, {firstName} {hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'}</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">
            {dateStr}
            {urgentTasks.length > 0 && <span className="text-[#EF4444] font-semibold"> · {urgentTasks.length} urgent</span>}
            {upcomingExams.length > 0 && ` · ${upcomingExams.length} exam${upcomingExams.length !== 1 ? 's' : ''} coming up`}
          </p>
        </div>
        <button
          onClick={() => navigate('/add')}
          className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[12px] md:text-[13px] font-semibold transition-all shadow-xs border-none cursor-pointer"
        >
          <Plus className="w-[13px] h-[13px]" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>

      <div className="px-4 md:px-8 pb-9">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-3.5 mb-5">
          <div className="bg-white border border-border rounded-r p-3 md:p-[18px] md:px-5 shadow-xs hover:shadow-sm transition-shadow flex items-center gap-2 md:gap-3.5">
            <div className="w-[32px] h-[32px] md:w-[38px] md:h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0 text-primary">
              <ListTodo className="w-[15px] h-[15px] md:w-[18px] md:h-[18px]" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[22px] md:text-[26px] font-bold text-text-1 leading-none">{activeTasks.length}</div>
              <div className="text-[10px] md:text-[12px] text-text-3 mt-0.5 font-medium">Active Tasks</div>
            </div>
          </div>
          <div className="bg-white border border-border rounded-r p-3 md:p-[18px] md:px-5 shadow-xs hover:shadow-sm transition-shadow flex items-center gap-2 md:gap-3.5">
            <div className="w-[32px] h-[32px] md:w-[38px] md:h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0 text-primary">
              <CalendarDays className="w-[15px] h-[15px] md:w-[18px] md:h-[18px]" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[22px] md:text-[26px] font-bold text-text-1 leading-none">{dueThisWeek.length}</div>
              <div className="text-[10px] md:text-[12px] text-text-3 mt-0.5 font-medium">Due This Week</div>
            </div>
          </div>
          <div className="bg-white border border-border rounded-r p-3 md:p-[18px] md:px-5 shadow-xs hover:shadow-sm transition-shadow flex items-center gap-2 md:gap-3.5">
            <div className="w-[32px] h-[32px] md:w-[38px] md:h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0 text-primary">
              <GraduationCap className="w-[15px] h-[15px] md:w-[18px] md:h-[18px]" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[22px] md:text-[26px] font-bold text-text-1 leading-none">{upcomingExams.length}</div>
              <div className="text-[10px] md:text-[12px] text-text-3 mt-0.5 font-medium">Exams Upcoming</div>
            </div>
          </div>
        </div>

        {/* Focus Plan Banner */}
        <div className="bg-primary rounded-r p-5 px-5 md:px-6 mb-5 flex flex-col md:flex-row gap-4 justify-between md:items-center shadow-sm">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-primary-mid mb-1.5">Today's Focus Plan</div>
            <div className="text-[15px] md:text-[17px] font-bold text-white mb-1">
              {priorityQueue.length > 0
                ? `${priorityQueue.length} task${priorityQueue.length !== 1 ? 's' : ''} recommended today`
                : "You're all caught up! 🎉"}
            </div>
            <div className="text-[12px] text-primary-mid leading-relaxed">
              {priorityQueue.length > 0
                ? `Start with: ${priorityQueue[0]?.title ?? '—'}`
                : 'No urgent tasks — add something to get started.'}
            </div>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-rs px-[18px] py-2 text-[13px] font-semibold cursor-pointer transition-colors whitespace-nowrap self-start md:self-auto"
          >
            Chat about my plan →
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-5 md:gap-7">

          {/* Priority Queue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-text-2 tracking-[0.01em]">Priority Queue</span>
              <button onClick={() => navigate('/tasks')} className="bg-transparent text-text-3 hover:text-primary hover:bg-primary-light border-none px-2.5 py-1.5 rounded-rs flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer transition-colors">See all</button>
            </div>

            <div className="bg-white border border-border rounded-r shadow-xs overflow-hidden">
              {tasksLoading ? (
                <div className="flex items-center gap-3 p-5 text-text-3 text-[13px]">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading tasks…
                </div>
              ) : priorityQueue.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-[32px] mb-2">✅</div>
                  <div className="text-[13.5px] font-semibold text-text-1 mb-1">No active tasks</div>
                  <div className="text-[12px] text-text-3 mb-3">Add your first task to get started</div>
                  <button onClick={() => navigate('/add')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-rs text-[12px] font-semibold border-none cursor-pointer">
                    <Plus className="w-3 h-3 mr-1" /> Add Task
                  </button>
                </div>
              ) : priorityQueue.map((task, idx) => {
                const rel = formatRelativeDate(task.due_date);
                const badgeClass = getDueBadgeClass(task.due_date);
                const statusColor = task.status === 'in_progress' ? 'bg-primary-light text-primary' : task.status === 'stuck' ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-bg text-text-3 border border-border';
                return (
                  <div key={task.id} className={`flex items-start gap-3 p-3.5 px-4 ${idx < priorityQueue.length - 1 ? 'border-b border-border' : ''} hover:bg-bg transition-colors cursor-pointer group`} onClick={() => navigate('/tasks')}>
                    <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-border2 bg-white shrink-0 mt-0.5 group-hover:border-primary group-hover:bg-primary-light transition-colors"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 mt-[5px]"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold text-text-1 mb-[3px] whitespace-nowrap overflow-hidden text-ellipsis">{task.title}</div>
                      <div className="text-[11.5px] text-text-3 flex gap-2.5 flex-wrap">
                        {task.due_date && <span>📅 {rel}</span>}
                        {task.estimated_hours && <span>⏱ {task.estimated_hours} hrs</span>}
                        {task.course_code && <span>{task.course_code}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.01em] ${badgeClass}`}>{rel}</span>
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.01em] ${statusColor}`}>{formatStatus(task.status)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exam Countdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-text-2 tracking-[0.01em]">Exam Countdown</span>
              <button onClick={() => navigate('/exams')} className="bg-transparent text-text-3 hover:text-primary hover:bg-primary-light border-none px-2.5 py-1.5 rounded-rs flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer transition-colors">View all</button>
            </div>

            {examsLoading ? (
              <div className="flex items-center gap-3 p-4 text-text-3 text-[13px] bg-white rounded-r border border-border">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading exams…
              </div>
            ) : upcomingExams.length === 0 ? (
              <div className="bg-white border border-border rounded-r p-4 text-center shadow-xs">
                <div className="text-[28px] mb-1">📚</div>
                <div className="text-[13px] font-semibold text-text-1 mb-1">No exams tracked</div>
                <div className="text-[12px] text-text-3 mb-3">Add an exam to start your revision plan</div>
                <button onClick={() => navigate('/add?tab=exam')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-rs text-[12px] font-semibold border-none cursor-pointer">
                  <Plus className="w-3 h-3" /> Add Exam
                </button>
              </div>
            ) : upcomingExams.slice(0, 3).map((exam, idx) => {
              const days = daysUntil(exam.exam_date);
              const prep = exam.preparation_percent ?? 0;
              return (
                <div key={exam.id} onClick={() => navigate('/exams')} className={`bg-white border border-border rounded-r p-3.5 px-4 ${idx < 2 ? 'mb-2.5' : 'mb-3'} cursor-pointer hover:border-primary-mid hover:shadow-sm transition-all shadow-xs`}>
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <div className="text-[13.5px] font-semibold text-text-1">{exam.subject}</div>
                      <div className="text-[11.5px] text-text-3 mt-0.5">
                        {exam.course_code && `${exam.course_code} · `}
                        {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-primary bg-primary-light rounded-md px-2 py-[3px] shrink-0">{days !== null ? `${days}d` : '—'}</span>
                  </div>
                  <div className="h-1 bg-bg rounded-[2px] overflow-hidden mb-2">
                    <div className="h-full rounded-[2px] bg-primary transition-[width] duration-300" style={{ width: `${prep}%` }}></div>
                  </div>
                  <div className="text-[11.5px] text-text-2 flex gap-1.5 items-start">
                    <span className="text-primary font-bold shrink-0">→</span>
                    {prep > 0 ? `${prep}% prepared — keep going!` : 'Start your revision plan today'}
                  </div>
                </div>
              );
            })}

            {/* Schedule Alert if overloaded */}
            {(() => {
              const overloaded = activeTasks.filter(t => {
                const d = daysUntil(t.due_date);
                return d !== null && d <= 2 && (t.estimated_hours || 0) > 0;
              });
              const totalHours = overloaded.reduce((s, t) => s + (t.estimated_hours || 0), 0);
              if (totalHours < 6) return null;
              return (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-r p-3.5 px-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#92400E] mb-1.5">⚠ Schedule Alert</div>
                  <div className="text-[12.5px] text-[#78350F] leading-relaxed">
                    You have <strong>{totalHours}hrs of work</strong> due in the next 2 days — plan carefully!
                  </div>
                  <button onClick={() => navigate('/chat')} className="mt-[11px] text-[12px] bg-white border border-border2 text-text-2 px-3 py-1.5 rounded-rs font-semibold shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all cursor-pointer">
                    Ask AI for help →
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
