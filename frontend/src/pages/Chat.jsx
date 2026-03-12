import { Send } from 'lucide-react';

export default function Chat() {
  return (
    <div className="h-full flex flex-col pt-7 animate-[fadeIn_0.2s_ease]">
      <div className="px-8 mb-4">
        <h1 className="text-[22px] font-bold text-text-1 tracking-[-0.3px]">AI Workload Chat</h1>
        <p className="text-[13px] text-text-3 mt-[3px]">Ask anything about your schedule, exams, or what to do next</p>
      </div>

      <div className="flex-1 px-8 pb-6 grid grid-cols-[1fr_256px] gap-5 min-h-0 overflow-hidden">
        
        {/* Chat Main Area */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-0 py-1 pb-3.5 flex flex-col gap-3.5 custom-scrollbar">
            
            <div className="flex gap-2.5 items-start">
              <div className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold bg-primary text-white">T</div>
              <div>
                <div className="max-w-[80%] p-3 px-3.5 rounded-xl text-[13.5px] leading-relaxed bg-white border border-border text-text-1 rounded-tl-sm shadow-xs">
                  Hey Kwame 👋 I can see your full schedule — 7 tasks and 2 upcoming exams.<br/><br/>
                  Your biggest risk this week is <strong className="font-bold">Friday's overload</strong>: Business Law and DB Lab Report are both due, totalling ~8 hours. I'd suggest starting the Law case study today.<br/><br/>
                  What would you like help with?
                </div>
                <div className="text-[10px] text-text-3 mt-1">9:02 AM</div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start flex-row-reverse">
              <div className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold bg-primary-light text-primary">KO</div>
              <div>
                <div className="max-w-[80%] p-3 px-3.5 rounded-xl text-[13.5px] leading-relaxed bg-primary text-white rounded-tr-sm ml-auto text-left">
                  I only have 2 hours tonight — what should I focus on?
                </div>
                <div className="text-[10px] text-text-3 mt-1 text-right">9:04 AM</div>
              </div>
            </div>

            <div className="flex gap-2.5 items-start">
              <div className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold bg-primary text-white">T</div>
              <div>
                <div className="max-w-[80%] p-3 px-3.5 rounded-xl text-[13.5px] leading-relaxed bg-white border border-border text-text-1 rounded-tl-sm shadow-xs">
                  With 2 hours tonight:<br/><br/>
                  <strong className="font-bold">Priority 1 (90 min):</strong> Data Structures Assignment — due tomorrow, only 40% done. Start with graph traversal questions.<br/><br/>
                  <strong className="font-bold">Priority 2 (30 min):</strong> Start the Business Law outline. Even just identifying key arguments tonight means Friday won't be a scramble.
                </div>
                <div className="text-[10px] text-text-3 mt-1">9:04 AM</div>
              </div>
            </div>

          </div>

          <div className="flex flex-wrap gap-[7px] mb-3 mt-2">
            <button className="bg-white border border-border rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium text-text-2 cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-faint">What's my riskiest task?</button>
            <button className="bg-white border border-border rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium text-text-2 cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-faint">Am I on track for my exams?</button>
            <button className="bg-white border border-border rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium text-text-2 cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-faint">Help me prioritise my week</button>
            <button className="bg-white border border-border rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium text-text-2 cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-faint">What can I safely delay?</button>
          </div>

          <div className="bg-white border-[1.5px] border-border rounded-r p-3 px-3.5 transition-colors focus-within:border-primary shadow-xs">
            <textarea 
              className="w-full border-none outline-none resize-none font-sans text-[13.5px] text-text-1 bg-transparent min-h-[20px] max-h-[80px] leading-relaxed placeholder:text-text-3" 
              placeholder="Ask anything about your workload…" 
              rows="1"
            ></textarea>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-text-3">Enter to send · Shift+Enter for new line</span>
              <button className="bg-primary hover:bg-primary-hover border-none w-[30px] h-[30px] rounded-[7px] cursor-pointer flex items-center justify-center transition-colors shrink-0">
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Context Sidebar */}
        <div className="flex flex-col gap-3.5 py-1 pb-3.5 overflow-y-auto custom-scrollbar">
          
          <div className="bg-white border border-border rounded-r p-[15px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Tasks in Context</div>
            <div className="flex items-center gap-2 py-1.5 border-b border-border text-[12.5px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0"></div>
              <div className="flex-1 font-medium text-text-1">Data Structures A3</div>
              <div className="text-[11px] text-[#EF4444] font-medium">Tomorrow</div>
            </div>
            <div className="flex items-center gap-2 py-1.5 border-b border-border text-[12.5px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0"></div>
              <div className="flex-1 font-medium text-text-1">Business Law Case</div>
              <div className="text-[11px] text-text-3 font-medium">Fri</div>
            </div>
            <div className="flex items-center gap-2 py-1.5 border-b border-border text-[12.5px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0"></div>
              <div className="flex-1 font-medium text-text-1">DB Lab Report</div>
              <div className="text-[11px] text-text-3 font-medium">Fri</div>
            </div>
            <div className="flex items-center gap-2 py-1.5 text-[12.5px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0"></div>
              <div className="flex-1 font-medium text-text-1">MIS 302 Reading</div>
              <div className="text-[11px] text-text-3 font-medium">Mon</div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-r p-[15px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Exams in Context</div>
            <div className="flex items-center gap-2 py-1.5 border-b border-border text-[12.5px]">
              <span className="bg-primary-light text-primary text-[10px] font-bold px-1.5 py-[1px] rounded">23d</span>
              <div className="flex-1 font-medium text-text-1">Data Structures</div>
            </div>
            <div className="flex items-center gap-2 py-1.5 text-[12.5px]">
              <span className="bg-primary-light text-primary text-[10px] font-bold px-1.5 py-[1px] rounded">35d</span>
              <div className="flex-1 font-medium text-text-1">Business Law</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
