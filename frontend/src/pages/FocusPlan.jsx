import { RefreshCw, CheckCircle2, Circle, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';
import { daysUntil } from '../utils/dates';

function blockColor(task) {
  const d = daysUntil(task.due_date);
  if (d !== null && d <= 1) return { border: '#EF4444', bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', badgeBg: 'bg-[#FEF2F2]', label: 'Due Today/Tomorrow', labelClass: 'text-[#EF4444]' };
  if (d !== null && d <= 4) return { border: '#D97706', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', badgeBg: 'bg-[#FFFBEB]', label: `Due in ${d} days`, labelClass: 'text-[#D97706]' };
  return { border: null, bg: 'bg-white', text: 'text-primary', badgeBg: 'bg-primary-light', label: `Due in ${d ?? '—'} days`, labelClass: 'text-primary' };
}

const TIME_SLOTS = ['Morning (9:00 AM–11:00 AM)', 'Afternoon (2:00 PM–4:00 PM)', 'Evening (6:00 PM–8:00 PM)'];

export default function FocusPlan() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: exams = [] } = useExams();
  const updateTask = useUpdateTask();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const activeTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      const dA = daysUntil(a.due_date) ?? 999;
      const dB = daysUntil(b.due_date) ?? 999;
      if (dA !== dB) return dA - dB;
      return (b.grade_weight || 0) - (a.grade_weight || 0);
    });

  const totalHours = activeTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const freeHours = Math.max(0, 8 - totalHours);
  const plannedHours = Math.min(totalHours, 6);
  const upcomingExams = exams.filter(e => daysUntil(e.exam_date) !== null && daysUntil(e.exam_date) >= 0);

  // Assign tasks to time slots (simplified: up to 3 tasks, one per session)
  const plannedTasks = activeTasks.slice(0, 3);

  function toggleDone(task) {
    const isDone = task.status === 'done';
    updateTask.mutate({ id: task.id, updates: { status: isDone ? 'not_started' : 'done' } });
  }

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Today's Focus Plan</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">AI-generated plan based on your tasks, exams, and free time</p>
        </div>
        <button
          onClick={() => navigate('/chat')}
          className="inline-flex items-center justify-center gap-[7px] px-3.5 py-[9px] bg-white border border-border2 text-text-2 hover:border-primary hover:text-primary hover:bg-primary-faint rounded-rs text-[12px] font-semibold transition-all shadow-xs cursor-pointer w-full md:w-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Ask AI for Better Plan
        </button>
      </div>

      <div className="px-4 md:px-8 pb-9">

        {/* Day Banner */}
        <div className="bg-primary rounded-r p-[18px] md:p-[22px] px-5 md:px-[26px] mb-6 flex flex-col justify-between items-start shadow-md relative overflow-hidden text-white">
          <div className="relative z-10 w-full flex flex-col md:flex-row justify-between gap-5">
            <div className="max-w-full md:max-w-[60%]">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-light mb-1.5 opacity-90">{dateStr}</div>
              <div className="text-[18px] md:text-[22px] font-bold mb-1.5 drop-shadow-sm">
                {isLoading ? 'Loading your plan…' : activeTasks.length === 0 ? 'You\'re all caught up! 🎉' : `${plannedTasks.length} session${plannedTasks.length !== 1 ? 's' : ''} planned today`}
              </div>
              <div className="text-[12px] md:text-[13px] text-primary-light font-medium leading-relaxed">
                {isLoading ? '' : activeTasks.length === 0
                  ? 'No active tasks — enjoy your free time or add something new!'
                  : `${plannedHours}hrs focused work planned · Priority: ${activeTasks[0]?.title ?? '—'}`
                }
              </div>
            </div>
            <div className="flex gap-4 md:gap-9 justify-start md:justify-end flex-1 pl-0 md:pl-8 items-center border-l-0 md:border-l border-white/20 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">{plannedTasks.length}</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">{plannedHours}</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">{upcomingExams.length}</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Exams</div>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-12 w-48 h-48 bg-white opacity-[0.03] rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-32 -bottom-16 w-32 h-32 bg-white opacity-[0.04] rounded-full blur-xl pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">

          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-text-1">Time Blocks</span>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 text-text-3 text-[13px] py-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Generating your plan…
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="bg-white border border-border rounded-r p-8 flex flex-col items-center gap-2 text-center shadow-xs">
                <div className="text-[40px]">✅</div>
                <div className="text-[14px] font-semibold text-text-1">Nothing to do today</div>
                <div className="text-[12.5px] text-text-3">All tasks are complete — or you haven't added any yet.</div>
                <button onClick={() => navigate('/add')} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-rs text-[13px] font-semibold border-none cursor-pointer">
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>
            ) : (
              <div className="relative border-l-2 border-border ml-3 pl-6 pb-4">
                {plannedTasks.map((task, idx) => {
                  const isDone = task.status === 'done';
                  const { border, bg, text, labelClass, label } = blockColor(task);
                  return (
                    <div key={task.id} className={`relative mb-6 pb-2 transition-all hover:-translate-y-0.5 ${isDone ? 'opacity-50' : ''}`}>
                      <div className={`absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-bg flex items-center justify-center ${isDone ? 'bg-primary' : 'bg-white border-2 border-primary'}`}>
                        {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className={`text-[12px] font-bold mb-1.5 uppercase tracking-[0.05em] ${text}`}>{TIME_SLOTS[idx] || `Session ${idx + 1}`}</div>
                      <div
                        className={`${bg} border rounded-r p-4 shadow-xs ${isDone ? 'line-through' : ''}`}
                        style={border ? { borderColor: `${border}33`, borderLeftColor: border, borderLeftWidth: '3px' } : {}}
                      >
                        <div className="flex items-start gap-3">
                          <div onClick={() => toggleDone(task)} className="cursor-pointer mt-0.5 shrink-0">
                            {isDone
                              ? <CheckCircle2 className="w-[18px] h-[18px] text-primary" />
                              : <Circle className="w-[18px] h-[18px] text-text-3 hover:text-primary transition-colors hover:fill-primary-faint" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-[14px] font-bold ${isDone ? 'text-text-3' : 'text-text-1'}`}>{task.title}</div>
                            <div className={`text-[12px] text-text-3 mb-2 flex gap-2 flex-wrap`}>
                              <span className={`font-semibold ${labelClass}`}>{label}</span>
                              {task.course_code && <span>· {task.course_code}</span>}
                              {task.estimated_hours && <span>· {task.estimated_hours} hrs</span>}
                            </div>
                            {task.description && !isDone && (
                              <div className={`text-[13px] text-text-2 px-3 py-2 rounded-rs border ${border ? 'bg-white border-border2' : 'bg-bg border-border2'}`}>
                                <strong>Note:</strong> {task.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div>
            <div className="bg-white border border-border rounded-r p-4.5 mb-4 shadow-xs">
              <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">AI Adjustments</div>
              {activeTasks.length > 0 ? (
                <>
                  <div className="text-[13px] text-text-2 leading-relaxed mb-3">
                    You have <strong>{activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}</strong>. Your most urgent is <strong>{activeTasks[0]?.title}</strong>.
                  </div>
                  <button onClick={() => navigate('/chat')} className="w-full bg-primary text-white text-[12px] font-semibold py-1.5 rounded-[6px] border-none shadow-xs hover:bg-primary-hover transition-colors cursor-pointer">Chat with AI →</button>
                </>
              ) : (
                <div className="text-[13px] text-text-2 leading-relaxed">No active tasks — you're ahead of the curve!</div>
              )}
            </div>

            {upcomingExams.length > 0 && (
              <div className="bg-white border border-border rounded-r p-4.5 shadow-xs">
                <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">Upcoming Exams</div>
                {upcomingExams.slice(0, 3).map(exam => {
                  const days = daysUntil(exam.exam_date);
                  return (
                    <div key={exam.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0 text-[12.5px]">
                      <span className="font-medium text-text-1 truncate mr-2">{exam.subject}</span>
                      <span className="text-primary font-bold shrink-0">{days}d</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
