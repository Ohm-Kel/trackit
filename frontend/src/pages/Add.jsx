import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Check } from 'lucide-react';
import { useCreateTask, useUpdateTask, useTasks } from '../hooks/useTasks';
import { useCreateExam, useUpdateExam, useExams } from '../hooks/useExams';

export default function Add() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const editTaskId = searchParams.get('edit');
  const editExamId = searchParams.get('editExam');
  const isEditMode = !!(editTaskId || editExamId);

  const initialTab = editExamId ? 'exam' : searchParams.get('tab') === 'exam' ? 'exam' : 'task';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [confidence, setConfidence] = useState('medium');
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [saveError, setSaveError] = useState('');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();

  // Fetch existing data for edit mode
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks();
  const { data: allExams = [], isLoading: examsLoading } = useExams();

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '', due_date: '', course_code: '', grade_weight: '',
    estimated_hours: '', status: 'not_started', description: '',
  });

  // Exam form state
  const [examForm, setExamForm] = useState({
    subject: '', course_code: '', exam_date: '', daily_study_hours: '',
  });

  // Populate the form once the record being edited has loaded. Done during
  // render (React's "adjust state when props change" pattern) rather than in an
  // effect, so the form never renders a frame with stale values.
  const editKey = editTaskId ? `task:${editTaskId}` : editExamId ? `exam:${editExamId}` : null;
  const [hydratedKey, setHydratedKey] = useState(null);
  const editTask = editTaskId ? allTasks.find(t => t.id === editTaskId) : undefined;
  const editExam = editExamId ? allExams.find(e => e.id === editExamId) : undefined;

  if (editKey && hydratedKey !== editKey && (editTask || editExam)) {
    setHydratedKey(editKey);
    if (editTask) {
      setTaskForm({
        title: editTask.title || '',
        due_date: editTask.due_date ? editTask.due_date.split('T')[0] : '',
        course_code: editTask.course_code || '',
        grade_weight: editTask.grade_weight ?? '',
        estimated_hours: editTask.estimated_hours ?? '',
        status: editTask.status || 'not_started',
        description: editTask.description || '',
      });
    }
    if (editExam) {
      setExamForm({
        subject: editExam.subject || '',
        course_code: editExam.course_code || '',
        exam_date: editExam.exam_date ? editExam.exam_date.split('T')[0] : '',
        daily_study_hours: editExam.daily_study_hours ?? '',
      });
      setConfidence(editExam.confidence_level || 'medium');
      setTopics(Array.isArray(editExam.topics) ? editExam.topics : []);
    }
  }

  // Keep the spinner only while the record is still loading; an unknown id
  // falls through to an empty form instead of spinning forever.
  const editSourceLoading = editTaskId ? tasksLoading : editExamId ? examsLoading : false;
  const loadingEdit = Boolean(editKey) && hydratedKey !== editKey && editSourceLoading;

  // Plain-text quick-fill
  const [nlpText, setNlpText] = useState('');
  const [showParsed, setShowParsed] = useState(false);

  const parsedData = nlpText ? {
    title: nlpText.split(' ').slice(0, 6).join(' '),
    due: 'Review and set manually',
    weight: nlpText.match(/(\d+)\s*%/)?.[1] ? nlpText.match(/(\d+)\s*%/)[1] + '%' : '—',
    effort: nlpText.match(/(\d+(?:\.\d+)?)\s*hour/i)?.[1] ? nlpText.match(/(\d+(?:\.\d+)?)\s*hour/i)[1] + ' hrs' : '—',
    status: nlpText.toLowerCase().includes('not started') ? 'not_started' : 'in_progress',
  } : null;

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (i) => setTopics(topics.filter((_, idx) => idx !== i));

  async function handleSaveTask() {
    if (!taskForm.title.trim()) return alert('Task name is required');
    const payload = {
      ...taskForm,
      grade_weight:    taskForm.grade_weight    ? Number(taskForm.grade_weight)    : undefined,
      estimated_hours: taskForm.estimated_hours ? Number(taskForm.estimated_hours) : undefined,
    };

    setSaveError('');
    try {
      if (editTaskId) {
        await updateTask.mutateAsync({ id: editTaskId, updates: payload });
      } else {
        await createTask.mutateAsync(payload);
      }
    } catch (err) {
      setSaveError(err.message);
      return;
    }
    setSavedOk(true);
    setTimeout(() => navigate('/tasks'), 800);
  }

  async function handleSaveExam() {
    if (!examForm.subject.trim()) return alert('Subject is required');
    const payload = {
      ...examForm,
      confidence_level:   confidence,
      topics,
      daily_study_hours:  examForm.daily_study_hours ? Number(examForm.daily_study_hours) : undefined,
    };

    setSaveError('');
    try {
      if (editExamId) {
        await updateExam.mutateAsync({ id: editExamId, updates: payload });
      } else {
        await createExam.mutateAsync(payload);
      }
    } catch (err) {
      setSaveError(err.message);
      return;
    }
    setSavedOk(true);
    setTimeout(() => navigate('/exams'), 800);
  }

  const isLoading = createTask.isPending || createExam.isPending || updateTask.isPending || updateExam.isPending;

  if (loadingEdit) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (savedOk) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 animate-[fadeIn_0.2s_ease]">
        <div className="w-14 h-14 rounded-full bg-[#F0FDF4] border-2 border-[#16A34A] flex items-center justify-center">
          <Check className="w-7 h-7 text-[#15803D]" strokeWidth={2.5} />
        </div>
        <div className="text-[16px] font-bold text-text-1">{isEditMode ? 'Updated successfully!' : 'Saved successfully!'}</div>
        <div className="text-[13px] text-text-3">Redirecting…</div>
      </div>
    );
  }

  const inputClass = "w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3";

  const STATUS_OPTIONS = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'stuck',       label: 'Stuck / Blocked' },
  ];

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">{isEditMode ? 'Edit' : 'Add New'}</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">
            {isEditMode ? 'Update the details below' : 'Describe your task or exam, or fill in the form below'}
          </p>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        {/* Tabs — disabled in edit mode */}
        {!isEditMode && (
          <div className="flex flex-col sm:flex-row gap-1 bg-bg p-1 rounded-[10px] mb-5.5 w-full sm:w-max border border-border">
            <button
              onClick={() => setActiveTab('task')}
              className={`px-5 py-2 sm:py-1.5 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all border-none ${activeTab === 'task' ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-3'}`}
            >
              📋 Assignment / Task
            </button>
            <button
              onClick={() => setActiveTab('exam')}
              className={`px-5 py-2 sm:py-1.5 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all border-none ${activeTab === 'exam' ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-3'}`}
            >
              📝 Exam
            </button>
          </div>
        )}

        {activeTab === 'task' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {/* Quick-fill — only in create mode */}
              {!isEditMode && (
                <>
                  <div className="bg-white border-[1.5px] border-border rounded-r p-4 mb-4.5 transition-colors focus-within:border-primary shadow-xs">
                    <div className="text-[11px] font-semibold text-primary mb-2 uppercase tracking-[0.06em]">✦ Quick fill from description</div>
                    <textarea
                      value={nlpText}
                      onChange={e => { setNlpText(e.target.value); setShowParsed(false); }}
                      className="w-full border-none outline-none resize-none font-sans text-[13.5px] text-text-1 bg-transparent leading-relaxed min-h-[64px] placeholder:text-text-3"
                      placeholder="e.g. 'Stats assignment due this Friday, worth 30%, about 4 hours of work, haven't started yet…'"
                    />
                    <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-border">
                      <span className="text-[11px] text-text-3">Extracts title, weight, and effort from your text</span>
                      <button
                        onClick={() => { if (nlpText.trim()) setShowParsed(true); }}
                        className="bg-primary text-white border-none px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-primary-hover transition-colors"
                      >
                        Parse Text
                      </button>
                    </div>
                  </div>

                  {showParsed && parsedData && (
                    <div className="bg-primary-faint border border-primary-mid rounded-rs p-3 mb-4.5">
                      <div className="text-[11px] font-semibold text-primary mb-2">✓ Parsed as:</div>
                      <div className="flex flex-wrap gap-1.5">
                        <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Task:</b> {parsedData.title}</div>
                        {parsedData.weight !== '—' && <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Weight:</b> {parsedData.weight}</div>}
                        {parsedData.effort !== '—' && <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Est:</b> {parsedData.effort}</div>}
                      </div>
                      <button
                        onClick={() => setTaskForm(f => ({
                          ...f,
                          title:           parsedData.title,
                          grade_weight:    parsedData.weight !== '—' ? parsedData.weight.replace('%', '') : f.grade_weight,
                          estimated_hours: parsedData.effort !== '—' ? parsedData.effort.replace(' hrs', '') : f.estimated_hours,
                          status:          parsedData.status,
                        }))}
                        className="mt-2 text-[12px] text-primary underline cursor-pointer bg-transparent border-none"
                      >
                        Use this → fill form
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11.5px] text-text-3 my-3 mb-4.5 before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
                    or fill in manually
                  </div>
                </>
              )}

              <div className="mb-3.5">
                <label htmlFor="add-task-name" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Task Name *</label>
                <input id="add-task-name" type="text" className={inputClass} placeholder="e.g. Statistics Assignment 2" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="mb-3.5">
                <label htmlFor="add-description" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Description</label>
                <textarea id="add-description" className={`${inputClass} resize-none min-h-[60px]`} placeholder="Additional notes or context…" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label htmlFor="add-due-date" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Due Date</label>
                  <input id="add-due-date" type="date" className={inputClass} value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="add-course-code" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Course Code</label>
                  <input id="add-course-code" type="text" className={inputClass} placeholder="e.g. STAT 201" value={taskForm.course_code} onChange={e => setTaskForm(f => ({ ...f, course_code: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label htmlFor="add-grade-weight" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Grade Weight (%)</label>
                  <input id="add-grade-weight" type="number" className={inputClass} placeholder="25" value={taskForm.grade_weight} onChange={e => setTaskForm(f => ({ ...f, grade_weight: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="add-estimated-hours" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Estimated Hours</label>
                  <input id="add-estimated-hours" type="number" className={inputClass} placeholder="4" step="0.5" value={taskForm.estimated_hours} onChange={e => setTaskForm(f => ({ ...f, estimated_hours: e.target.value }))} />
                </div>
              </div>

              <div className="mb-3.5">
                <label htmlFor="add-status" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Status</label>
                <select id="add-status"
                  className={inputClass}
                  value={taskForm.status}
                  onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="bg-white border border-border rounded-r p-4.5 mb-3.5 shadow-xs">
                <div className="text-[12px] font-bold text-text-2 mb-2.5 uppercase tracking-[0.05em]">Priority Preview</div>
                <div className="text-[13px] text-text-2 leading-relaxed mb-3">Fill in the due date and grade weight — Trackit will rank this against your existing tasks.</div>
                <div className="bg-bg rounded-rs p-3 border border-border">
                  <div className="text-[12px] font-semibold text-text-2 mb-1">This task will be tracked as:</div>
                  <div className="text-[13.5px] font-bold text-text-1">{taskForm.title || 'New Task'}</div>
                  <div className="text-[11.5px] text-text-3 mt-1">
                    {taskForm.due_date ? `Due: ${new Date(taskForm.due_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}` : 'No due date set'}
                    {taskForm.grade_weight ? ` · ${taskForm.grade_weight}% weight` : ''}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-border rounded-r p-4.5 shadow-xs">
                <div className="text-[12px] font-bold text-text-2 mb-2.5 uppercase tracking-[0.05em]">Tips</div>
                <div className="text-[13px] text-text-2 leading-[1.9]">
                  <div>· Grade weight matters — 5% quiz ranks below 40% exam</div>
                  <div>· Mark &quot;Stuck&quot; to get targeted help in AI Chat</div>
                  <div>· More detail = smarter priority reasoning</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exam' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="mb-3.5">
                <label htmlFor="add-subject-course-name" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Subject / Course Name *</label>
                <input id="add-subject-course-name" type="text" className={inputClass} placeholder="e.g. Calculus II" value={examForm.subject} onChange={e => setExamForm(f => ({ ...f, subject: e.target.value }))} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label htmlFor="add-exam-date" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Exam Date</label>
                  <input id="add-exam-date" type="date" className={inputClass} value={examForm.exam_date} onChange={e => setExamForm(f => ({ ...f, exam_date: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="add-course-code-2" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Course Code</label>
                  <input id="add-course-code-2" type="text" className={inputClass} placeholder="e.g. MATH 201" value={examForm.course_code} onChange={e => setExamForm(f => ({ ...f, course_code: e.target.value }))} />
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Confidence Level</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map(c => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={confidence === c}
                      onClick={() => setConfidence(c)}
                      className={`flex-1 p-[9px] border-[1.5px] rounded-rs text-center cursor-pointer text-[13px] font-semibold transition-all font-sans capitalize ${confidence === c ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-2 hover:border-primary-mid hover:text-primary'}`}
                    >
                      {c === 'low' ? '😰' : c === 'medium' ? '😐' : '😊'} {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <label htmlFor="add-topics-to-revise" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Topics to Revise</label>
                <div className="flex gap-2 mb-2">
                  <input id="add-topics-to-revise"
                    type="text"
                    value={topicInput}
                    onChange={e => setTopicInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
                    className={inputClass + ' flex-1'}
                    placeholder="e.g. Integration by parts"
                  />
                  <button onClick={handleAddTopic} className="bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Add</button>
                </div>
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {topics.map((topic, idx) => (
                      <span key={idx} className="bg-primary-light rounded-[20px] px-2.5 py-[3px] text-[12px] text-primary flex items-center gap-1.5 font-medium">
                        {topic}
                        <button type="button" aria-label={`Remove topic ${topic}`} onClick={() => handleRemoveTopic(idx)} className="p-0 bg-transparent border-none cursor-pointer text-primary-mid text-[14px] leading-none font-normal hover:text-primary">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3.5">
                <label htmlFor="add-daily-study-time-available-hou" className="text-[12px] font-semibold text-text-2 mb-1.5 block">Daily Study Time Available (hours)</label>
                <input id="add-daily-study-time-available-hou" type="number" className={inputClass} placeholder="e.g. 2" step="0.5" value={examForm.daily_study_hours} onChange={e => setExamForm(f => ({ ...f, daily_study_hours: e.target.value }))} />
              </div>
            </div>

            <div>
              <div className="bg-white border border-border rounded-r p-4.5 mb-3.5 shadow-xs">
                <div className="text-[12px] font-bold text-text-2 mb-2.5 uppercase tracking-[0.05em]">Revision Plan Preview</div>
                <div className="text-[13px] text-text-2 leading-relaxed mb-3.5">Trackit generates a day-by-day revision schedule counting back from your exam date.</div>
                <div className="bg-bg rounded-rs p-3 border border-border">
                  <div className="text-[13px] text-text-2 leading-[2.0]">
                    {examForm.exam_date ? (
                      <>
                        <div><span className="font-bold text-primary">Week 1:</span> Core concepts — {topics[0] || 'Topic 1'}</div>
                        <div><span className="font-bold text-primary">Week 2:</span> Problem solving — {topics[1] || 'Topic 2'}</div>
                        <div><span className="font-bold text-primary">Final week:</span> Past papers + weak area review</div>
                      </>
                    ) : (
                      <span className="text-text-3 italic">Set an exam date to preview your revision plan</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {saveError && (
          <div role="alert" className="mt-5 bg-[#FEF2F2] border border-[#FCA5A5] text-[#B91C1C] rounded-rs p-3 text-[13px]">
            Couldn&apos;t save: {saveError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-5.5 pt-5 border-t border-border">
          <button
            onClick={activeTab === 'task' ? handleSaveTask : handleSaveExam}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-rs text-[13px] font-semibold shadow-xs border-none cursor-pointer transition-colors w-full sm:w-auto disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEditMode
              ? (activeTab === 'task' ? 'Update Task' : 'Update Exam')
              : (activeTab === 'task' ? 'Save Task' : 'Save & Generate Plan')
            }
          </button>
          <button onClick={() => navigate(-1)} className="bg-white text-text-2 border border-border2 px-4 py-2 rounded-rs text-[13px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all w-full sm:w-auto">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
