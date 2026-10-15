import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Check, ChevronDown, ChevronRight, Loader2, AlertTriangle, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { formatRelativeDate, getDueBadgeClass, formatStatus, daysUntil } from '../utils/dates';
import { exportTasksCSV, exportTasksPDF } from '../utils/export';
import SubtaskList from '../components/SubtaskList';
import { TasksSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

function getStatusClass(status) {
  if (status === 'in_progress') return 'bg-primary-light text-primary';
  if (status === 'done') return 'bg-success-bg text-success';
  if (status === 'stuck') return 'bg-error-bg text-error';
  return 'bg-bg text-text-3 border border-border';
}

export default function Tasks() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!showExport) return;
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);

  const statuses = [
    { label: 'All', value: 'All' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Not Started', value: 'not_started' },
    { label: 'Stuck', value: 'stuck' },
    { label: 'Done', value: 'done' },
  ];

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.course_code?.toLowerCase().includes(search.toLowerCase());
      let matchStatus;
      if (filterStatus === 'All') {
        matchStatus = true;
      } else if (filterStatus === 'overdue') {
        matchStatus = t.status !== 'done' && t.due_date && daysUntil(t.due_date) < 0;
      } else {
        matchStatus = (t.status || 'not_started') === filterStatus;
      }
      return matchSearch && matchStatus;
    });
  }, [tasks, search, filterStatus]);

  const active = useMemo(() => filtered.filter(t => t.status !== 'done'), [filtered]);
  const done = useMemo(() => filtered.filter(t => t.status === 'done'), [filtered]);

  function toggleComplete(task) {
    const isDone = task.status === 'done';
    updateTask.mutate(
      { id: task.id, updates: { status: isDone ? 'not_started' : 'done' } },
      { onError: err => addToast(err.message, { type: 'error', title: "Couldn't update the task" }) },
    );
  }

  function handleDelete(e, taskId) {
    e.stopPropagation();
    if (window.confirm('Delete this task?')) deleteTask.mutate(taskId, { onError: err => addToast(err.message, { type: 'error', title: "Couldn't delete the task" }) });
  }

  const totalCount = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const overdueCount = tasks.filter(t => t.status !== 'done' && t.due_date && daysUntil(t.due_date) < 0).length;

  if (isLoading) return <TasksSkeleton />;

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">All Tasks</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">
            {isLoading ? 'Loading…' : `${totalCount} task${totalCount !== 1 ? 's' : ''} tracked${inProgressCount > 0 ? ` · ${inProgressCount} in progress` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tasks.length > 0 && (
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExport(!showExport)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-border text-text-2 rounded-rs text-[12px] font-semibold cursor-pointer hover:border-primary hover:text-primary transition-all shadow-xs"
              >
                <Download className="w-[13px] h-[13px]" />
                <span className="sr-only sm:not-sr-only">Export</span>
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-rs shadow-md z-10 py-1 min-w-[140px]">
                  <button onClick={() => { exportTasksCSV(tasks); setShowExport(false); }} className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium">Export as CSV</button>
                  <button onClick={() => { exportTasksPDF(tasks); setShowExport(false); }} className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium">Export as PDF</button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => navigate('/add')}
            className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[12px] md:text-[13px] font-semibold transition-all shadow-xs border-none cursor-pointer"
          >
            <Plus className="w-[13px] h-[13px]" />
            <span className="sr-only sm:not-sr-only">Add Task</span>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        {/* Overdue alert */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-error-bg border border-error-border rounded-rs text-[12.5px]">
            <AlertTriangle className="w-4 h-4 text-error shrink-0" />
            <span className="text-error font-semibold">{overdueCount} task{overdueCount !== 1 ? 's' : ''} overdue</span>
            <button
              onClick={() => setFilterStatus('overdue')}
              className="ml-auto text-[11.5px] font-semibold text-[#B91C1C] hover:underline bg-transparent border-none cursor-pointer"
            >
              Show overdue
            </button>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex items-center gap-2.5 mb-4.5 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-text-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-[32px] pr-3 py-[7px] bg-white border border-border rounded-rs text-[13px] text-text-1 outline-none focus:border-primary transition-colors placeholder:text-text-3"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statuses.map(s => (
              <button
                key={s.value}
                onClick={() => setFilterStatus(s.value)}
                className={`px-3 py-[5px] rounded-[20px] text-[12px] font-semibold border cursor-pointer transition-all ${filterStatus === s.value ? 'bg-primary text-white border-primary' : 'bg-white text-text-3 border-border hover:border-primary hover:text-primary'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filter Skeleton or Content */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-r shadow-xs p-8 flex flex-col items-center gap-2 text-center">
            <div className="text-[40px]">📋</div>
            <div className="text-[14px] font-semibold text-text-1">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filter'}
            </div>
            <div className="text-[12.5px] text-text-3">
              {tasks.length === 0 ? 'Add your first task to get started' : 'Try a different search or filter'}
            </div>
            {tasks.length === 0 && (
              <button onClick={() => navigate('/add')} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-rs text-[13px] font-semibold border-none cursor-pointer">
                <Plus className="w-3 h-3" /> Add Task
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-r shadow-xs overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[32px_1fr_36px] lg:grid-cols-[32px_minmax(0,1fr)_100px_80px_90px_90px_60px] py-2.5 px-3 lg:px-4 bg-bg border-b border-border text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 gap-2 items-center">
              <div></div>
              <div>Task</div>
              <div className="hidden lg:block">Due</div>
              <div className="hidden lg:block">Effort</div>
              <div className="hidden lg:block">Weight</div>
              <div className="hidden lg:block">Status</div>
              <div className="hidden lg:block"></div>
            </div>

            {/* Active Tasks */}
            {active.map(task => {
              const rel = formatRelativeDate(task.due_date);
              const dueBadge = getDueBadgeClass(task.due_date);
              const statusBadge = getStatusClass(task.status);
              const isDone = task.status === 'done';
              return (
                <div key={task.id}>
                  <div
                    onClick={() => setExpandedRow(expandedRow === task.id ? null : task.id)}
                    className={`grid grid-cols-[32px_1fr_36px] lg:grid-cols-[32px_minmax(0,1fr)_100px_80px_90px_90px_60px] py-3 px-3 lg:px-4 border-b border-border items-center gap-2 cursor-pointer transition-colors ${expandedRow === task.id ? 'bg-primary-faint' : 'hover:bg-bg'}`}
                  >
                    <button
                      type="button"
                      aria-label={isDone ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                      onClick={e => { e.stopPropagation(); toggleComplete(task); }}
                      className={`relative before:absolute before:-inset-[14px] before:content-[''] w-[17px] h-[17px] p-0 rounded-full border-[1.5px] shrink-0 mt-[2px] flex items-center justify-center transition-colors cursor-pointer ${isDone ? 'border-primary bg-primary' : 'border-border2 bg-white hover:border-primary hover:bg-primary-light'}`}
                    >
                      {isDone && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </button>
                    <div className="min-w-0 pr-2">
                      <div className={`text-[13.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${isDone ? 'line-through text-text-3' : 'text-text-1'}`}>{task.title}</div>
                      <div className="text-[11.5px] text-text-3 mt-0.5">
                        {task.course_code && <span>{task.course_code}</span>}
                        <span className="hidden lg:inline">{task.subtasks_count > 0 ? ` · ${task.subtasks_count} subtasks` : ''}</span>
                        <span className="lg:hidden"> · <span className={`font-semibold ${dueBadge.includes('EF') ? 'text-[#B91C1C]' : dueBadge.includes('D97') ? 'text-[#B45309]' : 'text-text-3'}`}>{rel}</span></span>
                      </div>
                    </div>
                    <div className="hidden lg:flex">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.01em] ${dueBadge}`}>{rel}</span>
                    </div>
                    <div className="hidden lg:block text-[12.5px] text-text-1 font-semibold">{task.estimated_hours ? `${task.estimated_hours} hrs` : '—'}</div>
                    <div className="hidden lg:block text-[12.5px] text-text-1 font-semibold">{task.grade_weight ? `${task.grade_weight}%` : '—'}</div>
                    <div className="hidden lg:flex">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.01em] ${statusBadge}`}>{formatStatus(task.status)}</span>
                    </div>
                    <div className="hidden lg:flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      <button
                        className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-primary-light hover:text-primary"
                        onClick={() => navigate(`/add?edit=${task.id}`)}
                        title="Edit"
                      >
                        <Edit2 className="w-[13px] h-[13px]" />
                      </button>
                      <button
                        className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                        onClick={e => handleDelete(e, task.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-[13px] h-[13px]" />
                      </button>
                    </div>
                    <div className="lg:hidden flex justify-end" onClick={e => e.stopPropagation()}>
                      <button
                        aria-label={expandedRow === task.id ? 'Hide details' : 'Show details'}
                        aria-expanded={expandedRow === task.id}
                        className="w-[44px] h-[44px] shrink-0 -mr-2 rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 hover:bg-primary-light hover:text-primary"
                        onClick={() => setExpandedRow(expandedRow === task.id ? null : task.id)}
                      >
                        {expandedRow === task.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Mobile expanded details */}
                  {expandedRow === task.id && (
                    <div className="px-4 py-3 bg-primary-faint border-b border-primary-mid">
                      <div className="grid grid-cols-2 gap-2 mb-3 text-[12.5px]">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-text-3 mb-0.5">Due</div>
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${dueBadge}`}>{rel}</span>
                        </div>
                        {task.estimated_hours && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-text-3 mb-0.5">Effort</div>
                            <span className="text-text-1 font-semibold">{task.estimated_hours} hrs</span>
                          </div>
                        )}
                        {task.grade_weight && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wide text-text-3 mb-0.5">Weight</div>
                            <span className="text-text-1 font-semibold">{task.grade_weight}%</span>
                          </div>
                        )}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wide text-text-3 mb-0.5">Status</div>
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge}`}>{formatStatus(task.status)}</span>
                        </div>
                      </div>
                      {task.description && (
                        <div className="text-[12.5px] text-text-2 mb-3 italic">{task.description}</div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/add?edit=${task.id}`)} className="flex-1 bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Edit</button>
                        <button onClick={e => handleDelete(e, task.id)} className="flex-1 bg-white text-[#B91C1C] border border-[#FCA5A5] px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-[#FEF2F2] transition-all">Delete</button>
                      </div>
                      <SubtaskList parentId={task.id} parentType="task" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Completed Tasks */}
            {done.length > 0 && (
              <>
                <div className="py-2 px-4 bg-bg border-b border-border text-[11px] font-bold uppercase tracking-[0.06em] text-text-3">
                  Completed ({done.length})
                </div>
                {done.map(task => (
                  <div
                    key={task.id}
                    className="grid grid-cols-[32px_1fr_36px] lg:grid-cols-[32px_minmax(0,1fr)_100px_80px_90px_90px_60px] py-3 px-3 lg:px-4 border-b border-border items-center gap-2 cursor-pointer transition-colors hover:bg-bg opacity-[0.55]"
                    onClick={() => toggleComplete(task)}
                  >
                    <button
                      type="button"
                      aria-label={`Mark "${task.title}" as not done`}
                      onClick={e => { e.stopPropagation(); toggleComplete(task); }}
                      className="relative before:absolute before:-inset-[14px] before:content-[''] w-[17px] h-[17px] p-0 rounded-full border-[1.5px] border-primary bg-primary shrink-0 mt-[2px] flex items-center justify-center cursor-pointer"
                    >
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </button>
                    <div className="min-w-0 pr-2">
                      <div className="text-[13.5px] font-semibold text-text-3 line-through whitespace-nowrap overflow-hidden text-ellipsis">{task.title}</div>
                      <div className="text-[11.5px] text-text-3 mt-0.5">
                        {task.course_code && <span className="hidden lg:inline">{task.course_code} · </span>}
                        <span className="hidden lg:inline">completed</span>
                        <span className="lg:hidden text-[#15803D] font-semibold">Done</span>
                      </div>
                    </div>
                    <div className="hidden lg:flex text-[12.5px] text-text-3">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</div>
                    <div className="hidden lg:block text-[12.5px] text-text-3">{task.estimated_hours ? `${task.estimated_hours} hrs` : '—'}</div>
                    <div className="hidden lg:block text-[12.5px] text-text-3">{task.grade_weight ? `${task.grade_weight}%` : '—'}</div>
                    <div className="hidden lg:flex">
                      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] tracking-[0.01em]">Done</span>
                    </div>
                    <div className="hidden lg:flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      <button title="Delete" className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C]" onClick={e => handleDelete(e, task.id)}><Trash2 className="w-[13px] h-[13px]" /></button>
                    </div>
                    <div className="lg:hidden"></div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
