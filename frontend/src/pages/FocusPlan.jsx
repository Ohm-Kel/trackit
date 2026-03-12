import { RefreshCw, CheckCircle2, Circle } from 'lucide-react';

export default function FocusPlan() {
  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">Today's Focus Plan</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">AI-generated plan based on your tasks, exams, and free time</p>
        </div>
        <button className="inline-flex items-center justify-center gap-[7px] px-3.5 py-[9px] bg-white border border-border2 text-text-2 hover:border-primary hover:text-primary hover:bg-primary-faint rounded-rs text-[12px] font-semibold transition-all shadow-xs cursor-pointer w-full md:w-auto">
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate Plan
        </button>
      </div>

      <div className="px-4 md:px-8 pb-9">
        
        {/* Day Banner */}
        <div className="bg-primary rounded-r p-[18px] md:p-[22px] px-5 md:px-[26px] mb-6 flex flex-col justify-between items-start shadow-md relative overflow-hidden text-white">
          <div className="relative z-10 w-full flex flex-col md:flex-row justify-between gap-5">
            <div className="max-w-full md:max-w-[60%]">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-primary-light mb-1.5 opacity-90">Thursday, March 12 — Study Day</div>
              <div className="text-[18px] md:text-[22px] font-bold mb-1.5 drop-shadow-sm">You have 5.5 free hours today</div>
              <div className="text-[12px] md:text-[13px] text-primary-light font-medium leading-relaxed">Trackit has planned <strong className="text-white font-bold">3.5hrs</strong> of focused work + <strong className="text-white font-bold">2hrs</strong> buffer</div>
            </div>
            <div className="flex gap-4 md:gap-9 justify-start md:justify-end flex-1 pl-0 md:pl-8 items-center border-l-0 md:border-l border-white/20 pt-4 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0">
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">3</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">3.5</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Hours</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] md:text-[28px] font-bold leading-none mb-1">2</div>
                <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.05em] text-primary-light">Tasks</div>
              </div>
            </div>
          </div>
          {/* Decorative background shapes */}
          <div className="absolute -right-8 -top-12 w-48 h-48 bg-white opacity-[0.03] rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute right-32 -bottom-16 w-32 h-32 bg-white opacity-[0.04] rounded-full blur-xl pointer-events-none"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          
          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-bold text-text-1">Time Blocks</span>
            </div>

            <div className="relative border-l-2 border-border ml-3 pl-6 pb-4">
              
              {/* Block 1 */}
              <div className="relative mb-6 pb-2 transition-all hover:-translate-y-0.5">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary ring-4 ring-bg"></div>
                <div className="text-[12px] font-bold text-primary mb-1.5 uppercase tracking-[0.05em]">Morning Block (9:00 AM - 11:00 AM)</div>
                <div className="bg-white border border-border rounded-r p-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <Circle className="w-[18px] h-[18px] text-text-3 mt-1 cursor-pointer hover:text-primary transition-colors hover:fill-primary-faint" />
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-text-1">Data Structures A3 — Graph Traversal</div>
                      <div className="text-[12px] text-text-3 mb-2 flex gap-2"><span className="text-[#EF4444] font-semibold">Due Tomorrow</span> · <span>CS 301</span> · <span>2.0 hrs</span></div>
                      <div className="text-[13px] text-text-2 bg-bg px-3 py-2 rounded-rs border border-border2">
                        <strong>Task:</strong> Read through Chapter 8, implement BFS in Python, and write the first 3 test cases.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Block 2 */}
              <div className="relative mb-6 pb-2 transition-all hover:-translate-y-0.5 opacity-50">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-bg flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="text-[12px] font-bold text-text-3 mb-1.5 uppercase tracking-[0.05em]">Afternoon Break (1:00 PM - 2:00 PM)</div>
                <div className="bg-bg border border-border2 rounded-r p-4 shadow-xs line-through">
                  <div className="text-[13px] font-semibold text-text-3 flex items-center gap-2">
                    Lunch and walk
                  </div>
                </div>
              </div>

              {/* Block 3 */}
              <div className="relative mb-6 pb-2 transition-all hover:-translate-y-0.5">
                <div className="absolute -left-[30px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#D97706] ring-4 ring-bg"></div>
                <div className="text-[12px] font-bold text-[#D97706] mb-1.5 uppercase tracking-[0.05em]">Evening Block (4:00 PM - 5:30 PM)</div>
                <div className="bg-white border border-[#D97706]/20 rounded-r p-4 shadow-sm border-l-[3px] border-l-[#D97706]">
                  <div className="flex items-start gap-3">
                    <Circle className="w-[18px] h-[18px] text-text-3 mt-1 cursor-pointer hover:text-primary transition-colors hover:fill-primary-faint" />
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-text-1">Business Law Case — Outline</div>
                      <div className="text-[12px] text-text-3 mb-2 flex gap-2"><span className="text-[#D97706] font-semibold">Due Friday</span> · <span>BL 202</span> · <span>1.5 hrs</span></div>
                      <div className="text-[13px] text-text-2 bg-[#FFFBEB] px-3 py-2 rounded-rs border border-[#FEF3C7]">
                        <strong>Task:</strong> Outline the arguments for offer and acceptance based on Carlill v Carbolic. Do not write full essay yet, just bullet points.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Sidebar Suggestions */}
          <div>
            <div className="bg-white border border-border rounded-r p-4.5 mb-4 shadow-xs">
              <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">AI Adjustments</div>
              <div className="text-[13px] text-text-2 leading-relaxed mb-3">Trackit noticed you skipped your MIS reading yesterday. Should we squeeze it into a 30-min slot tonight?</div>
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-white text-[12px] font-semibold py-1.5 rounded-[6px] border-none shadow-xs hover:bg-primary-hover transition-colors cursor-pointer">Yes, add it</button>
                <button className="flex-1 bg-white text-text-2 text-[12px] font-semibold py-1.5 rounded-[6px] border border-border2 shadow-xs hover:bg-bg transition-colors cursor-pointer">No, push to tmrw</button>
              </div>
            </div>

            <div className="bg-white border border-border rounded-r p-4.5 shadow-xs">
              <div className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-text-3 mb-3">Energy Levels</div>
              <div className="text-[13px] text-text-2 leading-relaxed">You typically complete analytical tasks (like Data Structures) 20% faster in the morning. This schedule reflects that pattern.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
