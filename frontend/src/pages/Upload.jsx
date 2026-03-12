import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function Upload() {
  const [examUploaded, setExamUploaded] = useState(false);
  const [scheduleUploaded, setScheduleUploaded] = useState(false);

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Upload Timetable</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">Claude extracts all exam dates and class schedules automatically</p>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-9">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] md:gap-[30px] mb-8">
          
          {/* Exam Timetable Card */}
          <div className="bg-white border border-border rounded-r p-6 shadow-xs relative">
            <h2 className="text-[16px] font-bold text-text-1 mb-2 flex items-center gap-2">📝 Exam Timetable</h2>
            <p className="text-[13px] text-text-2 leading-[1.65] mb-5">Upload your official exam schedule. Claude extracts each exam's subject, date, time, and venue — and creates countdown cards automatically.</p>
            
            {!examUploaded ? (
              <div 
                onClick={() => setExamUploaded(true)}
                className="border-[1.5px] border-dashed border-border2 rounded-r p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary-faint group"
              >
                <div className="w-[50px] h-[50px] bg-bg rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <UploadIcon className="w-6 h-6 text-text-3 group-hover:text-white transition-colors" />
                </div>
                <div className="text-[14px] font-bold text-text-1 mb-1">Drop your timetable here</div>
                <div className="text-[12px] text-text-3 mb-4">or click to browse files</div>
                <div className="flex gap-1.5 justify-center">
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">PDF</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">PNG</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">JPG</span>
                </div>
              </div>
            ) : (
              <div className="animate-[scaleIn_0.3s_ease]">
                <div className="flex items-center gap-3 bg-bg p-3 rounded-rs mb-4 border border-border">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#10B981] flex justify-center items-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-text-1 truncate">Exam_Timetable_Sem2_2026.pdf</div>
                    <div className="text-[11px] text-text-3">284 KB</div>
                  </div>
                </div>

                <div className="bg-primary-faint border border-primary-mid rounded-rs p-4 mb-4">
                  <div className="text-[12px] font-bold text-primary mb-3">Claude found 4 exams</div>
                  
                  <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px]">
                    <span className="font-semibold text-text-1">Data Structures</span>
                    <span className="text-text-3">Apr 2 · 9:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px]">
                    <span className="font-semibold text-text-1">Business Law</span>
                    <span className="text-text-3">Apr 14 · 2:00 PM</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px]">
                    <span className="font-semibold text-text-1">Database Systems</span>
                    <span className="text-text-3">Apr 22 · 10:00 AM</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[12.5px]">
                    <span className="font-semibold text-text-1">MIS 302</span>
                    <span className="text-text-3">May 3 · 9:00 AM</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button className="flex-1 bg-primary text-white border-none py-2 rounded-rs text-[12.5px] font-bold shadow-xs hover:bg-primary-hover cursor-pointer transition-colors">Import All 4 Exams</button>
                  <button onClick={() => setExamUploaded(false)} className="bg-white border text-text-2 border-border2 py-2 px-4 rounded-rs text-[12.5px] font-bold shadow-xs hover:border-primary hover:text-primary cursor-pointer transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Class Schedule Card */}
          <div className="bg-white border border-border rounded-r p-6 shadow-xs relative">
            <h2 className="text-[16px] font-bold text-text-1 mb-2 flex items-center gap-2">📅 Class Schedule</h2>
            <p className="text-[13px] text-text-2 leading-[1.65] mb-5">Upload your weekly class timetable so Trackit knows your free windows and won't schedule study sessions during lectures.</p>
            
            {!scheduleUploaded ? (
              <div 
                onClick={() => setScheduleUploaded(true)}
                className="border-[1.5px] border-dashed border-border2 rounded-r p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary-faint group"
              >
                <div className="w-[50px] h-[50px] bg-bg rounded-full flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <FileText className="w-6 h-6 text-text-3 group-hover:text-white transition-colors" />
                </div>
                <div className="text-[14px] font-bold text-text-1 mb-1">Drop your class schedule here</div>
                <div className="text-[12px] text-text-3 mb-4">or click to browse files</div>
                <div className="flex gap-1.5 justify-center">
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">PDF</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">PNG</span>
                  <span className="bg-[#F1F5F9] text-[#64748B] text-[10px] font-bold px-2 py-0.5 rounded-[4px]">JPG</span>
                </div>
              </div>
            ) : (
              <div className="animate-[scaleIn_0.3s_ease]">
                <div className="flex items-center gap-3 bg-bg p-3 rounded-rs mb-4 border border-border">
                  <div className="w-[28px] h-[28px] rounded-full bg-[#10B981] flex justify-center items-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-text-1 truncate">Class_Schedule_Sem2.png</div>
                    <div className="text-[11px] text-text-3">156 KB</div>
                  </div>
                </div>

                <div className="bg-primary-faint border border-primary-mid rounded-rs p-4 mb-4">
                  <div className="text-[12px] font-bold text-primary mb-3">Weekly schedule parsed</div>
                  
                  <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px]">
                    <span className="font-semibold text-text-1">Monday</span>
                    <span className="text-text-2 bg-white px-2 py-0.5 rounded-[4px] text-[11px] border border-border2">8am–2pm busy</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px]">
                    <span className="font-semibold text-text-1">Tuesday</span>
                    <span className="text-text-2 bg-white px-2 py-0.5 rounded-[4px] text-[11px] border border-border2">9am–1pm busy</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-primary-mid/50 text-[12.5px]">
                    <span className="font-semibold text-text-1">Wednesday</span>
                    <span className="text-text-2 bg-white px-2 py-0.5 rounded-[4px] text-[11px] border border-border2">2pm–5pm busy</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[12.5px]">
                    <span className="font-semibold text-text-1">Thu & Fri</span>
                    <span className="text-[#15803D] bg-[#DCFCE7] font-semibold px-2 py-0.5 rounded-[4px] text-[11px]">Free days</span>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button className="flex-1 bg-primary text-white border-none py-2 rounded-rs text-[12.5px] font-bold shadow-xs hover:bg-primary-hover cursor-pointer transition-colors">Import Schedule</button>
                  <button onClick={() => setScheduleUploaded(false)} className="bg-white border text-text-2 border-border2 py-2 px-4 rounded-rs text-[12.5px] font-bold shadow-xs hover:border-primary hover:text-primary cursor-pointer transition-colors">Cancel</button>
                </div>
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
