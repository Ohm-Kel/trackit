import { useState, useEffect, useRef } from 'react';
import { Plus, Loader2, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useExams, useUpdateExam, useDeleteExam } from '../hooks/useExams';
import { daysUntil } from '../utils/dates';
import { exportExamsCSV, exportExamsPDF } from '../utils/export';
import SubtaskList from '../components/SubtaskList';
import { ExamsSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

function confidenceStyle(level) {
  const l = (level || '').toLowerCase();
  if (l === 'high') return { badge: 'bg-success-bg text-success', label: '😊 High' };
  if (l === 'low') return { badge: 'bg-error-bg text-error', label: '😰 Low' };
  return { badge: 'bg-warning-bg text-warning', label: '😐 Medium' };
}

export default function Exams() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { data: exams = [], isLoading } = useExams();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();

  const [expandedExam, setExpandedExam] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (!showExport) return;
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showExport]);

  const upcoming = exams.filter(e => daysUntil(e.exam_date) >= 0);
  const past = exams.filter(e => daysUntil(e.exam_date) < 0);

  function handleDelete(e, id) {
    e.stopPropagation();
    if (window.confirm('Remove this exam?')) deleteExam.mutate(id, { onError: err => addToast(err.message, { type: 'error', title: "Couldn't remove the exam" }) });
  }

  if (isLoading) return <ExamsSkeleton />;

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Exam Countdown</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">
            {isLoading ? 'Loading…' : `${upcoming.length} exam${upcoming.length !== 1 ? 's' : ''} tracked${upcoming.length > 0 ? ' · revision plans active' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {exams.length > 0 && (
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
                  <button onClick={() => { exportExamsCSV(exams); setShowExport(false); }} className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium">Export as CSV</button>
                  <button onClick={() => { exportExamsPDF(exams); setShowExport(false); }} className="w-full text-left px-3 py-2 text-[12.5px] text-text-1 hover:bg-bg border-none bg-transparent cursor-pointer font-medium">Export as PDF</button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => navigate('/add?tab=exam')}
            className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[12px] md:text-[13px] font-semibold transition-all shadow-xs border-none cursor-pointer"
          >
            <Plus className="w-[13px] h-[13px]" />
            <span className="sr-only sm:not-sr-only">Add Exam</span>
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        {upcoming.length === 0 && past.length === 0 ? (
          <div className="bg-white border border-border rounded-r shadow-xs p-10 flex flex-col items-center gap-2 text-center">
            <div className="text-[48px]">🎓</div>
            <div className="text-[15px] font-bold text-text-1">No exams tracked yet</div>
            <div className="text-[13px] text-text-3 max-w-[280px]">Add your upcoming exams and Trackit will build you a personalised revision plan.</div>
            <button onClick={() => navigate('/add?tab=exam')} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-rs text-[13px] font-semibold border-none cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Add Your First Exam
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mb-6">
                {upcoming.map(exam => {
                  const days = daysUntil(exam.exam_date);
                  const prep = exam.preparation_percent ?? 0;
                  const { badge, label } = confidenceStyle(exam.confidence_level);
                  const topics = Array.isArray(exam.topics) ? exam.topics : [];

                  return (
                    <div key={exam.id} className="bg-white border border-border rounded-r p-5 md:p-5.5 shadow-xs hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-[17px] md:text-[18px] font-bold text-text-1">{exam.subject}</div>
                          <div className="text-[12px] text-text-3 mt-[3px]">
                            {exam.course_code && `${exam.course_code} · `}
                            {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBD'}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-[26px] md:text-[30px] font-bold text-primary leading-none">{days}</div>
                          <div className="text-[10.5px] text-text-3 mt-0.5">days left</div>
                        </div>
                      </div>

                      <div className="h-[5px] bg-bg rounded-[3px] overflow-hidden my-2.5">
                        <div className="h-full rounded-[3px] bg-primary transition-[width] duration-300" style={{ width: `${prep}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-text-3 mb-3.5">
                        <span>{prep}% prepared</span>
                        <span>Exam day</span>
                      </div>

                      <div className="flex items-center justify-between mb-3.5 pb-3.5 border-b border-border">
                        <span className="text-[12px] font-semibold text-text-2">Confidence</span>
                        <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-[2px] rounded-[20px] tracking-[0.01em] ${badge}`}>{label}</span>
                      </div>

                      {topics.length > 0 && (
                        <div className="mb-4">
                          <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Topics to Revise</div>
                          <div className="flex flex-wrap gap-1.5">
                            {topics.map((topic, i) => (
                              <span key={i} className="bg-primary-light text-primary text-[11px] font-medium px-2 py-0.5 rounded-[12px]">{topic}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <button onClick={() => navigate(`/add?editExam=${exam.id}`)} className="flex-1 bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Edit</button>
                        <button
                          onClick={() => {
                            const newPrep = Math.min(100, prep + 10);
                            updateExam.mutate({ id: exam.id, updates: { preparation_percent: newPrep } }, { onError: err => addToast(err.message, { type: 'error', title: "Couldn't update the exam" }) });
                          }}
                          className="flex-1 bg-primary text-white border-none px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-primary-hover transition-colors"
                        >
                          Mark Today Done ✓
                        </button>
                      </div>

                      {/* Subtasks toggle */}
                      <button
                        onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
                        className="mt-2 w-full flex items-center justify-center gap-1 text-[11.5px] text-text-3 hover:text-primary transition-colors cursor-pointer bg-transparent border-none py-1"
                      >
                        {expandedExam === exam.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expandedExam === exam.id ? 'Hide' : 'Show'} Revision Subtasks
                      </button>

                      {expandedExam === exam.id && (
                        <SubtaskList parentId={exam.id} parentType="exam" />
                      )}

                      <button onClick={e => handleDelete(e, exam.id)} className="mt-1 w-full text-[11.5px] text-text-3 hover:text-[#B91C1C] transition-colors text-center cursor-pointer bg-transparent border-none py-1">Remove exam</button>
                    </div>
                  );
                })}
              </div>
            )}

            {past.length > 0 && (
              <>
                <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">Past Exams</div>
                <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 opacity-60">
                  {past.map(exam => (
                    <div key={exam.id} className="bg-white border border-border rounded-r p-4 shadow-xs">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-[14px] font-bold text-text-1 line-through">{exam.subject}</div>
                          <div className="text-[11.5px] text-text-3 mt-0.5">
                            {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                          </div>
                        </div>
                        <span className="bg-success-bg text-success text-[11px] font-semibold px-2 py-0.5 rounded-full">Done</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
