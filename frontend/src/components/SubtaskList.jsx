import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Loader2 } from 'lucide-react';
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../hooks/useSubtasks';
import { useToast } from './Toast';

export default function SubtaskList({ parentId, parentType = 'task' }) {
  const { data: subtasks = [], isLoading } = useSubtasks(parentId, parentType);
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask(parentId);
  const deleteSubtask = useDeleteSubtask(parentId);
  const [newTitle, setNewTitle] = useState('');
  const { addToast } = useToast();
  const showError = (action) => (err) => addToast(err.message, { type: 'error', title: `Couldn't ${action}` });

  function handleAdd() {
    if (!newTitle.trim()) return;
    const parentKey = parentType === 'task' ? 'task_id' : 'exam_id';
    createSubtask.mutate(
      { [parentKey]: parentId, title: newTitle.trim(), order_index: subtasks.length },
      { onSuccess: () => setNewTitle(''), onError: showError("add the subtask") }
    );
  }

  function toggleDone(sub) {
    const newStatus = sub.status === 'done' ? 'not_started' : 'done';
    updateSubtask.mutate({ id: sub.id, updates: { status: newStatus } }, { onError: showError('update the subtask') });
  }

  const doneCount = subtasks.filter(s => s.status === 'done').length;
  const totalCount = subtasks.length;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-text-3 py-2">
        <Loader2 className="w-3 h-3 animate-spin text-primary" /> Loading subtasks…
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3">
          Subtasks {totalCount > 0 && `(${doneCount}/${totalCount})`}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1 bg-bg rounded-full overflow-hidden mb-2.5">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-300"
            style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map(sub => (
          <div key={sub.id} className="flex items-center gap-2 group py-1">
            <button
              onClick={() => toggleDone(sub)}
              className="bg-transparent border-none cursor-pointer p-0 shrink-0"
            >
              {sub.status === 'done'
                ? <CheckCircle2 className="w-[15px] h-[15px] text-primary" />
                : <Circle className="w-[15px] h-[15px] text-text-3 hover:text-primary transition-colors" />
              }
            </button>
            <span className={`flex-1 text-[12.5px] ${sub.status === 'done' ? 'line-through text-text-3' : 'text-text-1'}`}>
              {sub.title}
            </span>
            <button
              onClick={() => deleteSubtask.mutate(sub.id, { onError: showError('delete the subtask') })}
              className="bg-transparent border-none cursor-pointer p-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-3 hover:text-[#EF4444]"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          placeholder="Add a subtask…"
          className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-text-1 placeholder:text-text-3"
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim() || createSubtask.isPending}
          className="bg-transparent border-none cursor-pointer p-0 text-text-3 hover:text-primary transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
