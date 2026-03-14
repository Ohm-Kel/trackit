import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Check, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { formatRelativeDate, getDueBadgeClass, formatStatus } from '../utils/dates';

function getStatusClass(status) {
  if (status === 'in_progress') return 'bg-primary-light text-primary';
  if (status === 'done') return 'bg-[#F0FDF4] text-[#16A34A]';
  if (status === 'stuck') return 'bg-[#FEF2F2] text-[#EF4444]';
  return 'bg-bg text-text-3 border border-border';
}

export default function Tasks() {
  const navigate = useNavigate();
  const { data: tasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const statuses = [
    { label: 'All', value: 'All' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Not Started', value: 'not_started' },
    { label: 'Done', value: 'done' },
  ];

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.course_code?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || (t.status || 'not_started') === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [tasks, search, filterStatus]);

  const active = useMemo(() => filtered.filter(t => t.status !== 'done'), [filtered]);
  const done = useMemo(() => filtered.filter(t => t.status === 'done'), [filtered]);

  function toggleComplete(task) {
    const isDone = task.status === 'done';
    updateTask.mutate({ id: task.id, updates: { status: isDone ? 'not_started' : 'done' } });
  }

  function handleDelete(e, taskId) {
    e.stopPropagation();
    if (window.confirm('Delete this task?')) deleteTask.mutate(taskId);
  }

  const totalCount = tasks.length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">All Tasks</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">
            {isLoading ? 'Loading…' : `${totalCount} task${totalCount !== 1 ? 's' : ''} tracked${inProgressCount > 0 ? ` · ${inProgressCount} in progress` : ''}`}
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

        {/* Loading */}
        {isLoading ? (
          <div className="bg-white border border-border rounded-r shadow-xs p-8 flex flex-col items-center gap-3 text-text-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-[13px]">Loading your tasks…</span>
          </div>
        ) : filtered.length === 0 ? (
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
            <div className="grid grid-cols-[32px_1fr_36px] md:grid-cols-[32px_1fr_100px_80px_90px_90px_60px] py-2.5 px-3 md:px-4 bg-bg border-b border-border text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 gap-2 items-center">
              <div></div>
              <div>Task</div>
              <div className="hidden md:block">Due</div>
              <div className="hidden md:block">Effort</div>
              <div className="hidden md:block">Weight</div>
              <div className="hidden md:block">Status</div>
              <div className="hidden md:block"></div>
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
                    className={`grid grid-cols-[32px_1fr_36px] md:grid-cols-[32px_1fr_100px_80px_90px_90px_60px] py-3 px-3 md:px-4 border-b border-border items-center gap-2 cursor-pointer transition-colors ${expandedRow === task.id ? 'bg-primary-faint' : 'hover:bg-bg'}`}
                  >
                    <div
                      onClick={e => { e.stopPropagation(); toggleComplete(task); }}
                      className={`w-[17px] h-[17px] rounded-full border-[1.5px] shrink-0 mt-[2px] flex items-center justify-center transition-colors cursor-pointer ${isDone ? 'border-primary bg-primary' : 'border-border2 bg-white hover:border-primary hover:bg-primary-light'}`}
                    >
                      {isDone && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className={`text-[13.5px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis ${isDone ? 'line-through text-text-3' : 'text-text-1'}`}>{task.title}</div>
                      <div className="text-[11.5px] text-text-3 mt-0.5">
                        {task.course_code && <span>{task.course_code}</span>}
                        <span className="hidden md:inline">{task.subtasks_count > 0 ? ` · ${task.subtasks_count} subtasks` : ''}</span>
                        <span className="md:hidden"> · <span className={`font-semibold ${dueBadge.includes('EF') ? 'text-[#EF4444]' : dueBadge.includes('D97') ? 'text-[#D97706]' : 'text-text-3'}`}>{rel}</span></span>
                      </div>
                    </div>
                    <div className="hidden md:flex">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.01em] ${dueBadge}`}>{rel}</span>
                    </div>
                    <div className="hidden md:block text-[12.5px] text-text-1 font-semibold">{task.estimated_hours ? `${task.estimated_hours} hrs` : '—'}</div>
                    <div className="hidden md:block text-[12.5px] text-text-1 font-semibold">{task.grade_weight ? `${task.grade_weight}%` : '—'}</div>
                    <div className="hidden md:flex">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full tracking-[0.01em] ${statusBadge}`}>{formatStatus(task.status)}</span>
                    </div>
                    <div className="hidden md:flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      <button
                        className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-primary-light hover:text-primary"
                        onClick={() => navigate(`/add?edit=${task.id}`)}
                        title="Edit"
                      >
                        <Edit2 className="w-[13px] h-[13px]" />
                      </button>
                      <button
                        className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]"
                        onClick={e => handleDelete(e, task.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-[13px] h-[13px]" />
                      </button>
                    </div>
                    <div className="md:hidden flex justify-end" onClick={e => e.stopPropagation()}>
                      <button
                        className="w-[28px] h-[28px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 hover:bg-primary-light hover:text-primary"
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
                        <button onClick={e => handleDelete(e, task.id)} className="flex-1 bg-white text-[#EF4444] border border-[#FCA5A5] px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-[#FEF2F2] transition-all">Delete</button>
                      </div>
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
                    className="grid grid-cols-[32px_1fr_36px] md:grid-cols-[32px_1fr_100px_80px_90px_90px_60px] py-3 px-3 md:px-4 border-b border-border items-center gap-2 cursor-pointer transition-colors hover:bg-bg opacity-[0.55]"
                    onClick={() => toggleComplete(task)}
                  >
                    <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-primary bg-primary shrink-0 mt-[2px] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    <div className="min-w-0 pr-2">
                      <div className="text-[13.5px] font-semibold text-text-3 line-through whitespace-nowrap overflow-hidden text-ellipsis">{task.title}</div>
                      <div className="text-[11.5px] text-text-3 mt-0.5">
                        {task.course_code && <span className="hidden md:inline">{task.course_code} · </span>}
                        <span className="hidden md:inline">completed</span>
                        <span className="md:hidden text-[#16A34A] font-semibold">Done</span>
                      </div>
                    </div>
                    <div className="hidden md:flex text-[12.5px] text-text-3">{task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</div>
                    <div className="hidden md:block text-[12.5px] text-text-3">{task.estimated_hours ? `${task.estimated_hours} hrs` : '—'}</div>
                    <div className="hidden md:block text-[12.5px] text-text-3">{task.grade_weight ? `${task.grade_weight}%` : '—'}</div>
                    <div className="hidden md:flex">
                      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] tracking-[0.01em]">Done</span>
                    </div>
                    <div className="hidden md:flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                      <button className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-[#FEF2F2] hover:text-[#EF4444]" onClick={e => handleDelete(e, task.id)}><Trash2 className="w-[13px] h-[13px]" /></button>
                    </div>
                    <div className="md:hidden"></div>
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
