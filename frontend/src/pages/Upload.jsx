import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { parseUpload, importExams, saveSchedule } from '../api/upload';
import { useOnline } from '../hooks/useOnline';
import OfflineNotice from '../pwa/OfflineNotice';

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp';
// Base64 encoding adds ~33%, so 6 MB stays under the API's 10 MB body limit.
const MAX_SIZE = 6 * 1024 * 1024;
// Claude rejects images larger than 5 MB.
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Rows the parser could not read and skipped, so the student can check them. */
function ParseWarnings({ warnings }) {
  if (!warnings.length) return null;
  return (
    <div role="status" className="bg-[#FFFBEB] border border-[#FDE68A] rounded-rs p-3 mb-4 text-[12.5px] text-[#92400E]">
      {warnings.map(w => <div key={w}>{w} Check the original and add anything missing by hand.</div>)}
    </div>
  );
}

function DayRow({ day, classes }) {
  if (!classes || classes.length === 0) {
    return (
      <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px] last:border-b-0">
        <span className="font-semibold text-text-1 capitalize">{day}</span>
        <span className="text-[#15803D] bg-[#DCFCE7] font-semibold px-2 py-0.5 rounded-[4px] text-[11px]">Free</span>
      </div>
    );
  }
  const summary = classes.map(c => `${c.start}–${c.end}`).join(', ');
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px] last:border-b-0">
      <span className="font-semibold text-text-1 capitalize">{day}</span>
      <span className="text-text-2 bg-white px-2 py-0.5 rounded-[4px] text-[11px] border border-border2">{summary} busy</span>
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const online = useOnline();

  // Exam upload state
  const [examFile, setExamFile] = useState(null);
  const [examParsing, setExamParsing] = useState(false);
  const [examResults, setExamResults] = useState(null);
  const [examError, setExamError] = useState(null);
  const [examImporting, setExamImporting] = useState(false);
  const [examImported, setExamImported] = useState(false);
  const [examWarnings, setExamWarnings] = useState([]);
  const examInputRef = useRef(null);

  // Schedule upload state
  const [schedFile, setSchedFile] = useState(null);
  const [schedParsing, setSchedParsing] = useState(false);
  const [schedResults, setSchedResults] = useState(null);
  const [schedError, setSchedError] = useState(null);
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedSaved, setSchedSaved] = useState(false);
  const [schedWarnings, setSchedWarnings] = useState([]);
  const schedInputRef = useRef(null);

  function validateFile(file) {
    if (!file) return 'No file selected';
    if (file.size > MAX_SIZE) return `File too large (max ${formatSize(MAX_SIZE)})`;
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['pdf', 'png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'Unsupported file type';
    if (ext !== 'pdf' && file.size > MAX_IMAGE_SIZE) return `Image too large (max ${formatSize(MAX_IMAGE_SIZE)})`;
    return null;
  }

  // ── Exam timetable handlers ──

  async function handleExamFile(file) {
    const err = validateFile(file);
    if (err) { setExamError(err); return; }
    setExamFile(file);
    setExamError(null);
    setExamResults(null);
    setExamImported(false);
    setExamWarnings([]);
    setExamParsing(true);
    try {
      const result = await parseUpload(file, 'exam');
      setExamResults(Array.isArray(result.data) ? result.data : []);
      setExamWarnings(Array.isArray(result.warnings) ? result.warnings : []);
    } catch (e) {
      setExamError(e.message);
    } finally {
      setExamParsing(false);
    }
  }

  async function handleImportExams() {
    if (!examResults || examResults.length === 0) return;
    setExamImporting(true);
    try {
      await importExams(examResults);
      setExamImported(true);
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    } catch (e) {
      setExamError(e.message);
    } finally {
      setExamImporting(false);
    }
  }

  function resetExam() {
    setExamFile(null);
    setExamResults(null);
    setExamError(null);
    setExamImported(false);
    setExamWarnings([]);
    if (examInputRef.current) examInputRef.current.value = '';
  }

  // ── Schedule handlers ──

  async function handleSchedFile(file) {
    const err = validateFile(file);
    if (err) { setSchedError(err); return; }
    setSchedFile(file);
    setSchedError(null);
    setSchedResults(null);
    setSchedSaved(false);
    setSchedWarnings([]);
    setSchedParsing(true);
    try {
      const result = await parseUpload(file, 'schedule');
      setSchedResults(result.data && typeof result.data === 'object' ? result.data : null);
      setSchedWarnings(Array.isArray(result.warnings) ? result.warnings : []);
    } catch (e) {
      setSchedError(e.message);
    } finally {
      setSchedParsing(false);
    }
  }

  async function handleSaveSchedule() {
    if (!schedResults) return;
    setSchedSaving(true);
    try {
      await saveSchedule(schedResults);
      setSchedSaved(true);
    } catch (e) {
      setSchedError(e.message);
    } finally {
      setSchedSaving(false);
    }
  }

  function resetSched() {
    setSchedFile(null);
    setSchedResults(null);
    setSchedError(null);
    setSchedSaved(false);
    setSchedWarnings([]);
    if (schedInputRef.current) schedInputRef.current.value = '';
  }

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Upload Timetable</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">AI extracts exam dates and class schedules automatically</p>
          <OfflineNotice className="mt-2" />
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] md:gap-[30px] mb-8">

          {/* ── Exam Timetable Card ── */}
          <div className="bg-white border border-border rounded-r p-6 shadow-xs">
            <h2 className="text-[16px] font-bold text-text-1 mb-2 flex items-center gap-2">📝 Exam Timetable</h2>
            <p className="text-[13px] text-text-2 leading-[1.65] mb-5">Upload your official exam schedule. AI extracts each exam's subject, date, time, and venue — and creates countdown cards automatically.</p>

            <input
              ref={examInputRef}
              aria-label="Exam timetable file"
              type="file"
              accept={ACCEPTED}
              className="hidden"
              disabled={!online}
              onChange={e => { if (e.target.files[0]) handleExamFile(e.target.files[0]); }}
            />

            {!examFile ? (
              <div
                onClick={() => examInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleExamFile(e.dataTransfer.files[0]); }}
                className="border-[1.5px] border-dashed border-border2 rounded-r p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary-faint group"
              >
                <div className="w-[50px] h-[50px] bg-bg rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <UploadIcon className="w-6 h-6 text-text-3 group-hover:text-white transition-colors" />
                </div>
                <div className="text-[14px] font-bold text-text-1 mb-1">Drop your timetable here</div>
                <div className="text-[12px] text-text-3 mb-4">or click to browse files</div>
                <div className="flex gap-1.5 justify-center">
                  {['PDF', 'PNG', 'JPG'].map(t => (
                    <span key={t} className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">{t}</span>
                  ))}
                </div>
              </div>
            ) : examParsing ? (
              <div className="flex flex-col items-center gap-3 py-8 text-text-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-[13px] font-medium">AI is reading your timetable…</span>
              </div>
            ) : examImported ? (
              <div className="animate-[fadeIn_0.2s_ease]">
                <div className="flex items-center gap-3 bg-[#F0FDF4] p-4 rounded-rs border border-[#BBF7D0] mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
                  <div>
                    <div className="text-[13px] font-bold text-[#166534]">{examResults.length} exam{examResults.length !== 1 ? 's' : ''} imported successfully!</div>
                    <div className="text-[12px] text-[#15803D]">Countdown cards are now live on your Exams page.</div>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => navigate('/exams')} className="flex-1 bg-primary text-white border-none py-2 rounded-rs text-[12.5px] font-bold shadow-xs hover:bg-primary-hover cursor-pointer transition-colors">View Exams</button>
                  <button onClick={resetExam} className="bg-white border text-text-2 border-border2 py-2 px-4 rounded-rs text-[12.5px] font-bold shadow-xs hover:border-primary hover:text-primary cursor-pointer transition-colors">Upload Another</button>
                </div>
              </div>
            ) : examResults ? (
              <div className="animate-[fadeIn_0.2s_ease]">
                <div className="flex items-center gap-3 bg-bg p-3 rounded-rs mb-4 border border-border">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#10B981] flex justify-center items-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-text-1 truncate">{examFile.name}</div>
                    <div className="text-[11px] text-text-3">{formatSize(examFile.size)}</div>
                  </div>
                  <button onClick={resetExam} className="p-1 text-text-3 hover:text-[#B91C1C] bg-transparent border-none cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>

                {examResults.length === 0 ? (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-rs p-4 mb-4 text-[12.5px] text-[#92400E]">
                    No exams could be extracted. Try a clearer image or a different file.
                  </div>
                ) : (
                  <div className="bg-primary-faint border border-primary-mid rounded-rs p-4 mb-4">
                    <div className="text-[12px] font-bold text-primary mb-3">AI found {examResults.length} exam{examResults.length !== 1 ? 's' : ''}</div>
                    {examResults.map((exam, i) => (
                      <div key={i} className={`flex items-center justify-between py-1.5 text-[12.5px] ${i < examResults.length - 1 ? 'border-b border-primary-mid/50' : ''}`}>
                        <span className="font-semibold text-text-1">{exam.subject}{exam.course_code ? ` (${exam.course_code})` : ''}</span>
                        <span className="text-text-3 shrink-0 ml-2">
                          {exam.exam_date || 'Date TBD'}
                          {exam.exam_time ? ` · ${exam.exam_time}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <ParseWarnings warnings={examWarnings} />

                <div className="flex gap-2.5">
                  {examResults.length > 0 && (
                    <button
                      onClick={handleImportExams}
                      disabled={examImporting || !online}
                      className="flex-1 bg-primary text-white border-none py-2 rounded-rs text-[12.5px] font-bold shadow-xs hover:bg-primary-hover cursor-pointer transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                    >
                      {examImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Import {examResults.length} Exam{examResults.length !== 1 ? 's' : ''}
                    </button>
                  )}
                  <button onClick={resetExam} className="bg-white border text-text-2 border-border2 py-2 px-4 rounded-rs text-[12.5px] font-bold shadow-xs hover:border-primary hover:text-primary cursor-pointer transition-colors">Cancel</button>
                </div>
              </div>
            ) : null}

            {examError && (
              <div className="mt-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-rs p-3 text-[12.5px] text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <div>{examError} <button onClick={resetExam} className="text-primary underline bg-transparent border-none cursor-pointer ml-1">Try again</button></div>
              </div>
            )}
          </div>

          {/* ── Class Schedule Card ── */}
          <div className="bg-white border border-border rounded-r p-6 shadow-xs">
            <h2 className="text-[16px] font-bold text-text-1 mb-2 flex items-center gap-2">📅 Class Schedule</h2>
            <p className="text-[13px] text-text-2 leading-[1.65] mb-5">Upload your weekly class timetable so Trackit knows your free windows and won't schedule study sessions during lectures.</p>

            <input
              ref={schedInputRef}
              aria-label="Class schedule file"
              type="file"
              accept={ACCEPTED}
              className="hidden"
              disabled={!online}
              onChange={e => { if (e.target.files[0]) handleSchedFile(e.target.files[0]); }}
            />

            {!schedFile ? (
              <div
                onClick={() => schedInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleSchedFile(e.dataTransfer.files[0]); }}
                className="border-[1.5px] border-dashed border-border2 rounded-r p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary-faint group"
              >
                <div className="w-[50px] h-[50px] bg-bg rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6 text-text-3 group-hover:text-white transition-colors" />
                </div>
                <div className="text-[14px] font-bold text-text-1 mb-1">Drop your class schedule here</div>
                <div className="text-[12px] text-text-3 mb-4">or click to browse files</div>
                <div className="flex gap-1.5 justify-center">
                  {['PDF', 'PNG', 'JPG'].map(t => (
                    <span key={t} className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">{t}</span>
                  ))}
                </div>
              </div>
            ) : schedParsing ? (
              <div className="flex flex-col items-center gap-3 py-8 text-text-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-[13px] font-medium">AI is reading your schedule…</span>
              </div>
            ) : schedSaved ? (
              <div className="animate-[fadeIn_0.2s_ease]">
                <div className="flex items-center gap-3 bg-[#F0FDF4] p-4 rounded-rs border border-[#BBF7D0] mb-4">
                  <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0" />
                  <div>
                    <div className="text-[13px] font-bold text-[#166534]">Schedule saved!</div>
                    <div className="text-[12px] text-[#15803D]">Your free windows are now visible in the Focus Plan.</div>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <button onClick={() => navigate('/focus')} className="flex-1 bg-primary text-white border-none py-2 rounded-rs text-[12.5px] font-bold shadow-xs hover:bg-primary-hover cursor-pointer transition-colors">View Focus Plan</button>
                  <button onClick={resetSched} className="bg-white border text-text-2 border-border2 py-2 px-4 rounded-rs text-[12.5px] font-bold shadow-xs hover:border-primary hover:text-primary cursor-pointer transition-colors">Upload Another</button>
                </div>
              </div>
            ) : schedResults ? (
              <div className="animate-[fadeIn_0.2s_ease]">
                <div className="flex items-center gap-3 bg-bg p-3 rounded-rs mb-4 border border-border">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#10B981] flex justify-center items-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-text-1 truncate">{schedFile.name}</div>
                    <div className="text-[11px] text-text-3">{formatSize(schedFile.size)}</div>
                  </div>
                  <button onClick={resetSched} className="p-1 text-text-3 hover:text-[#B91C1C] bg-transparent border-none cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>

                <div className="bg-primary-faint border border-primary-mid rounded-rs p-4 mb-4">
                  <div className="text-[12px] font-bold text-primary mb-3">Weekly schedule parsed</div>
                  {DAYS.map(day => (
                    <DayRow key={day} day={day} classes={schedResults[day]} />
                  ))}
                </div>

                <ParseWarnings warnings={schedWarnings} />

                <div className="flex gap-2.5">
                  <button
                    onClick={handleSaveSchedule}
                    disabled={schedSaving || !online}
                    className="flex-1 bg-primary text-white border-none py-2 rounded-rs text-[12.5px] font-bold shadow-xs hover:bg-primary-hover cursor-pointer transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {schedSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Import Schedule
                  </button>
                  <button onClick={resetSched} className="bg-white border text-text-2 border-border2 py-2 px-4 rounded-rs text-[12.5px] font-bold shadow-xs hover:border-primary hover:text-primary cursor-pointer transition-colors">Cancel</button>
                </div>
              </div>
            ) : null}

            {schedError && (
              <div className="mt-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-rs p-3 text-[12.5px] text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <div>{schedError} <button onClick={resetSched} className="text-primary underline bg-transparent border-none cursor-pointer ml-1">Try again</button></div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg border border-border rounded-r p-6 pb-7">
          <div className="text-[15px] font-bold text-text-1 mb-4 flex items-center gap-2">
            <AlertCircle className="w-[18px] h-[18px] text-text-3" />
            What happens after import?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[20px] md:gap-[30px]">
            <div>
              <div className="text-[13px] font-bold text-text-1 mb-1">Smart Scheduling</div>
              <div className="text-[13px] text-text-2 leading-relaxed">Focus sessions only fill your free windows — never during lectures or classes.</div>
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-1 mb-1">Auto Exam Cards</div>
              <div className="text-[13px] text-text-2 leading-relaxed">All imported exams get countdown cards and AI-generated revision plans instantly.</div>
            </div>
            <div>
              <div className="text-[13px] font-bold text-text-1 mb-1">Conflict Detection</div>
              <div className="text-[13px] text-text-2 leading-relaxed">Trackit warns you when a deadline falls the day before an exam — weeks ahead of time.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
