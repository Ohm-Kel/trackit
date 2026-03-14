import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Circle, Loader2, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';
import { useProfile } from '../hooks/useProfile';
import { daysUntil } from '../utils/dates';

function blockColor(task) {
  const d = daysUntil(task.due_date);
  if (d !== null && d < 0) return { border: '#991B1B', bg: 'bg-[#FEF2F2]', text: 'text-[#991B1B]', badgeBg: 'bg-[#FEF2F2]', label: 'OVERDUE', labelClass: 'text-[#991B1B]' };
  if (d !== null && d <= 1) return { border: '#EF4444', bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', badgeBg: 'bg-[#FEF2F2]', label: 'Due Today/Tomorrow', labelClass: 'text-[#EF4444]' };
  if (d !== null && d <= 4) return { border: '#D97706', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', badgeBg: 'bg-[#FFFBEB]', label: `Due in ${d} days`, labelClass: 'text-[#D97706]' };
  return { border: null, bg: 'bg-white', text: 'text-primary', badgeBg: 'bg-primary-light', label: `Due in ${d ?? '—'} days`, labelClass: 'text-primary' };
}

// Default time slots when no schedule is uploaded
const DEFAULT_SLOTS = [
  { label: 'Morning', time: '9:00 AM – 11:00 AM', start: 9, end: 11 },
  { label: 'Afternoon', time: '2:00 PM – 4:00 PM', start: 14, end: 16 },
  { label: 'Evening', time: '6:00 PM – 8:00 PM', start: 18, end: 20 },
];

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Compute free time slots for today based on the user's uploaded weekly schedule.
 * If no schedule exists, falls back to DEFAULT_SLOTS.
 */
function computeFreeSlots(schedule) {
  if (!schedule) return DEFAULT_SLOTS;

  const today = DAY_NAMES[new Date().getDay()];
  const classes = schedule[today];

  if (!classes || !Array.isArray(classes) || classes.length === 0) {
    // Free all day
    return DEFAULT_SLOTS;
  }

  // Parse class times into numbers
  const busy = classes
    .map(c => ({
      start: parseTime(c.start),
      end: parseTime(c.end),
      subject: c.subject || '',
    }))
    .filter(c => c.start !== null && c.end !== null)
    .sort((a, b) => a.start - b.start);

  // Find free windows between 8:00 and 21:00
  const FREE_START = 8;
  const FREE_END = 21;
  const MIN_SLOT_HOURS = 1.5;
  const freeSlots = [];

  let cursor = FREE_START;
  for (const block of busy) {
    if (block.start > cursor && (block.start - cursor) >= MIN_SLOT_HOURS) {
      freeSlots.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < FREE_END && (FREE_END - cursor) >= MIN_SLOT_HOURS) {
    freeSlots.push({ start: cursor, end: FREE_END });
  }

  if (freeSlots.length === 0) return DEFAULT_SLOTS;

  return freeSlots.slice(0, 4).map(slot => ({
    label: slot.start < 12 ? 'Morning' : slot.start < 17 ? 'Afternoon' : 'Evening',
    time: `${formatHour(slot.start)} – ${formatHour(slot.end)}`,
    start: slot.start,
    end: slot.end,
  }));
}

function parseTime(str) {
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) + parseInt(parts[1], 10) / 60;
}

function formatHour(h) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const suffix = hr >= 12 ? 'PM' : 'AM';
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, '0')} ${suffix}`;
}

export default function FocusPlan() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const { data: exams = [] } = useExams();
  const { profile } = useProfile();
  const updateTask = useUpdateTask();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  // Compute schedule-aware free slots
  const freeSlots = computeFreeSlots(profile?.weekly_schedule);
  const hasSchedule = !!profile?.weekly_schedule;

  const activeTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      // Overdue first, then by urgency, then by grade weight
      const dA = daysUntil(a.due_date) ?? 999;
      const dB = daysUntil(b.due_date) ?? 999;
      // Overdue tasks (negative days) get highest priority
      if (dA < 0 && dB >= 0) return -1;
      if (dB < 0 && dA >= 0) return 1;
      if (dA !== dB) return dA - dB;
      return (b.grade_weight || 0) - (a.grade_weight || 0);
    });

  const overdueTasks = activeTasks.filter(t => {
    const d = daysUntil(t.due_date);
    return d !== null && d < 0;
  });

  const totalHours = activeTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const availableHours = freeSlots.reduce((s, slot) => s + (slot.end - slot.start), 0);
  const plannedHours = Math.min(totalHours, availableHours);
  const upcomingExams = exams.filter(e => daysUntil(e.exam_date) !== null && daysUntil(e.exam_date) >= 0);

  // Assign tasks to available free slots
  const plannedTasks = activeTasks.slice(0, freeSlots.length);

  function toggleDone(task) {
    const isDone = task.status === 'done';
    updateTask.mutate({ id: task.id, updates: { status: isDone ? 'not_started' : 'done' } });
  }

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Today's Focus Plan</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">
            {hasSchedule
              ? 'Personalised plan built around your class schedule'
              : 'Upload your timetable for schedule-aware planning'}
          </p>
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

        {/* Overdue Alert */}
        {overdueTasks.length > 0 && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-r p-4 mb-4 flex items-start gap-3">
            <span className="text-[20px] shrink-0">🚨</span>
            <div>
              <div className="text-[13px] font-bold text-[#991B1B] mb-0.5">
                {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
              </div>
              <div className="text-[12.5px] text-[#7F1D1D]">
                {overdueTasks.map(t => `"${t.title}"`).join(', ')} — complete or reschedule these first.
              </div>
            </div>
          </div>
        )}

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
                  : `${plannedHours.toFixed(1)}hrs focused work · ${freeSlots.length} free window${freeSlots.length !== 1 ? 's' : ''} today`
                }
              </div>
            </div>
            <div className="flex gap-4 md:gap-9 justify-start md:justify-end flex-1 pl-0 md:pl-8 items-center border-l-0 md:border-l border-white/20 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">{plannedTasks.length}</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">{availableHours.toFixed(0)}</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Free Hrs</div>
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
              {hasSchedule && (
                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold bg-primary-light px-2 py-0.5 rounded-full">
                  <Calendar className="w-3 h-3" /> Schedule-aware
                </span>
              )}
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
                  const slot = freeSlots[idx];
                  const slotLabel = slot ? `${slot.label} (${slot.time})` : `Session ${idx + 1}`;
                  return (
                    <div key={task.id} className={`relative mb-6 pb-2 transition-all hover:-translate-y-0.5 ${isDone ? 'opacity-50' : ''}`}>
                      <div className={`absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-bg flex items-center justify-center ${isDone ? 'bg-primary' : 'bg-white border-2 border-primary'}`}>
                        {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className={`text-[12px] font-bold mb-1.5 uppercase tracking-[0.05em] ${text}`}>{slotLabel}</div>
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
                              {task.status === 'stuck' && <span className="text-[#EF4444] font-semibold">· Stuck</span>}
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

                {/* Show remaining tasks not assigned to slots */}
                {activeTasks.length > freeSlots.length && (
                  <div className="mt-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-2">
                      +{activeTasks.length - freeSlots.length} more task{activeTasks.length - freeSlots.length !== 1 ? 's' : ''} not scheduled today
                    </div>
                    {activeTasks.slice(freeSlots.length, freeSlots.length + 3).map(task => (
                      <div key={task.id} className="flex items-center gap-2 py-1.5 text-[12.5px] text-text-3">
                        <Circle className="w-3 h-3 shrink-0" />
                        <span className="truncate">{task.title}</span>
                        {task.due_date && <span className="shrink-0 ml-auto text-[11px]">{daysUntil(task.due_date)}d</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div>
            {/* Schedule Info */}
            {!hasSchedule && (
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-r p-4 mb-4">
                <div className="text-[12px] font-bold text-[#92400E] mb-1.5">📅 No class schedule uploaded</div>
                <div className="text-[12px] text-[#78350F] leading-relaxed mb-2">
                  Upload your timetable so the Focus Plan avoids scheduling during your lectures.
                </div>
                <button
                  onClick={() => navigate('/upload')}
                  className="w-full bg-white text-[#92400E] border border-[#FDE68A] text-[12px] font-semibold py-1.5 rounded-[6px] shadow-xs hover:bg-[#FFFBEB] transition-colors cursor-pointer"
                >
                  Upload Timetable →
                </button>
              </div>
            )}

            <div className="bg-white border border-border rounded-r p-4.5 mb-4 shadow-xs">
              <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">AI Adjustments</div>
              {activeTasks.length > 0 ? (
                <>
                  <div className="text-[13px] text-text-2 leading-relaxed mb-3">
                    You have <strong>{activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}</strong>.
                    {overdueTasks.length > 0 && <span className="text-[#EF4444] font-semibold"> {overdueTasks.length} overdue!</span>}
                    {' '}Most urgent: <strong>{activeTasks[0]?.title}</strong>.
                  </div>
                  <button onClick={() => navigate('/chat')} className="w-full bg-primary text-white text-[12px] font-semibold py-1.5 rounded-[6px] border-none shadow-xs hover:bg-primary-hover transition-colors cursor-pointer">Chat with AI →</button>
                </>
              ) : (
                <div className="text-[13px] text-text-2 leading-relaxed">No active tasks — you're ahead of the curve!</div>
              )}
            </div>

            {/* Today's Schedule */}
            {hasSchedule && (
              <div className="bg-white border border-border rounded-r p-4.5 mb-4 shadow-xs">
                <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">Today's Classes</div>
                {(() => {
                  const today = DAY_NAMES[new Date().getDay()];
                  const classes = profile?.weekly_schedule?.[today] || [];
                  if (classes.length === 0) return <div className="text-[12.5px] text-primary font-semibold">No classes today — full day free!</div>;
                  return classes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0 text-[12.5px]">
                      <span className="font-medium text-text-1 truncate mr-2">{c.subject || 'Class'}</span>
                      <span className="text-text-3 shrink-0">{c.start}–{c.end}</span>
                    </div>
                  ));
                })()}
              </div>
            )}

            {upcomingExams.length > 0 && (
              <div className="bg-white border border-border rounded-r p-4.5 shadow-xs">
                <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">Upcoming Exams</div>
                {upcomingExams.slice(0, 3).map(exam => {
                  const days = daysUntil(exam.exam_date);
                  return (
                    <div key={exam.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0 text-[12.5px]">
                      <span className="font-medium text-text-1 truncate mr-2">{exam.subject}</span>
                      <span className={`font-bold shrink-0 ${days <= 3 ? 'text-[#EF4444]' : 'text-primary'}`}>{days}d</span>
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
