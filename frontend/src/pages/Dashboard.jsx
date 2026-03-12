import { Plus, ListTodo, CalendarDays, GraduationCap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-7 px-8 pb-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text-1 tracking-[-0.3px]">Good morning, Kwame ☀️</h1>
          <p className="text-[13px] text-text-3 mt-[3px]">Tuesday, March 10 · 3 urgent tasks · 2 exams coming up</p>
        </div>
        <button 
          onClick={() => navigate('/add')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[13px] font-semibold transition-all shadow-xs border-none cursor-pointer"
        >
          <Plus className="w-[13px] h-[13px]" />
          Add Task
        </button>
      </div>

      <div className="px-8 pb-9">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3.5 mb-5">
          <div className="bg-white border border-border rounded-r p-[18px] px-5 shadow-xs hover:shadow-sm transition-shadow flex items-center gap-3.5">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0 text-primary">
              <ListTodo className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[26px] font-bold text-text-1 leading-none">7</div>
              <div className="text-[12px] text-text-3 mt-0.5 font-medium">Active Tasks</div>
            </div>
          </div>
          <div className="bg-white border border-border rounded-r p-[18px] px-5 shadow-xs hover:shadow-sm transition-shadow flex items-center gap-3.5">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0 text-primary">
              <CalendarDays className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[26px] font-bold text-text-1 leading-none">3</div>
              <div className="text-[12px] text-text-3 mt-0.5 font-medium">Due This Week</div>
            </div>
          </div>
          <div className="bg-white border border-border rounded-r p-[18px] px-5 shadow-xs hover:shadow-sm transition-shadow flex items-center gap-3.5">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-primary-light flex items-center justify-center shrink-0 text-primary">
              <GraduationCap className="w-[18px] h-[18px]" strokeWidth={1.6} />
            </div>
            <div>
              <div className="text-[26px] font-bold text-text-1 leading-none">2</div>
              <div className="text-[12px] text-text-3 mt-0.5 font-medium">Exams Upcoming</div>
            </div>
          </div>
        </div>

        {/* Focus Plan Banner */}
        <div className="bg-primary rounded-r p-5 px-6 mb-5 flex justify-between items-center shadow-sm">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.08em] uppercase text-primary-mid mb-1.5">Today's Focus Plan</div>
            <div className="text-[18px] font-bold text-white mb-1">3 hours of work recommended</div>
            <div className="text-[12.5px] text-primary-mid">Morning: Data Structures (2hr) · Evening: MIS reading (1hr)</div>
          </div>
          <button 
            onClick={() => navigate('/chat')}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/25 rounded-rs px-[18px] py-2 text-[13px] font-semibold cursor-pointer transition-colors whitespace-nowrap"
          >
            Chat about my plan →
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-[1fr_290px] gap-5">
          
          {/* Main List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-text-2 tracking-[0.01em]">Priority Queue</span>
              <button onClick={() => navigate('/tasks')} className="bg-transparent text-text-3 hover:text-primary hover:bg-primary-light border-none px-2.5 py-1.5 rounded-rs flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer transition-colors">See all</button>
            </div>
            
            <div className="bg-white border border-border rounded-r shadow-xs overflow-hidden">
              {/* Task Item 1 */}
              <div className="flex items-start gap-3 p-3.5 px-4 border-b border-border hover:bg-bg transition-colors cursor-pointer group">
                <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-border2 bg-white shrink-0 mt-0.5 group-hover:border-primary group-hover:bg-primary-light transition-colors"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0 mt-[5px]"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-text-1 mb-[3px]">Data Structures — Assignment 3</div>
                  <div className="text-[11.5px] text-text-3 flex gap-2.5 flex-wrap">
                    <span>📅 Tomorrow</span><span>⏱ 4 hrs</span><span>CS 301</span>
                  </div>
                  <div className="text-[11.5px] text-text-3 mt-1 italic">Due in 24hrs, worth 25% grade, only 40% done</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#EF4444] tracking-[0.01em]">Due Tomorrow</span>
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary tracking-[0.01em]">In Progress</span>
                </div>
              </div>

              {/* Task Item 2 */}
              <div className="flex items-start gap-3 p-3.5 px-4 border-b border-border hover:bg-bg transition-colors cursor-pointer group">
                <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-border2 bg-white shrink-0 mt-0.5 group-hover:border-primary group-hover:bg-primary-light transition-colors"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0 mt-[5px]"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-text-1 mb-[3px]">Business Law — Case Study Analysis</div>
                  <div className="text-[11.5px] text-text-3 flex gap-2.5 flex-wrap">
                    <span>📅 Friday</span><span>⏱ 5 hrs</span><span>BL 202</span>
                  </div>
                  <div className="text-[11.5px] text-text-3 mt-1 italic">4 days away, 30% grade weight, not started yet</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] tracking-[0.01em]">4 days</span>
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-3 border border-border tracking-[0.01em]">Not Started</span>
                </div>
              </div>

              {/* Task Item 3 */}
              <div className="flex items-start gap-3 p-3.5 px-4 border-b border-border hover:bg-bg transition-colors cursor-pointer group">
                <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-border2 bg-white shrink-0 mt-0.5 group-hover:border-primary group-hover:bg-primary-light transition-colors"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0 mt-[5px]"></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold text-text-1 mb-[3px]">Database Systems — Lab Report</div>
                  <div className="text-[11.5px] text-text-3 flex gap-2.5 flex-wrap">
                    <span>📅 Friday</span><span>⏱ 3 hrs</span><span>DB 401</span>
                  </div>
                  <div className="text-[11.5px] text-text-3 mt-1 italic">Same week as Law case study — start today</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] tracking-[0.01em]">4 days</span>
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary tracking-[0.01em]">In Progress</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Sidebar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-text-2 tracking-[0.01em]">Exam Countdown</span>
              <button onClick={() => navigate('/exams')} className="bg-transparent text-text-3 hover:text-primary hover:bg-primary-light border-none px-2.5 py-1.5 rounded-rs flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer transition-colors">View all</button>
            </div>

            <div onClick={() => navigate('/exams')} className="bg-white border border-border rounded-r p-3.5 px-4 mb-2.5 cursor-pointer hover:border-primary-mid hover:shadow-sm transition-all shadow-xs">
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <div className="text-[13.5px] font-semibold text-text-1">Data Structures</div>
                  <div className="text-[11.5px] text-text-3 mt-0.5">April 2nd, 2026</div>
                </div>
                <span className="text-[12px] font-bold text-primary bg-primary-light rounded-md px-2 py-[3px] shrink-0">23 days</span>
              </div>
              <div className="h-1 bg-bg rounded-[2px] overflow-hidden mb-2">
                <div className="h-full rounded-[2px] bg-primary transition-[width] duration-300 w-[35%]"></div>
              </div>
              <div className="text-[11.5px] text-text-2 flex gap-1.5 items-start">
                <span className="text-primary font-bold shrink-0">→</span>
                Today: Review trees & graph traversal algorithms
              </div>
            </div>

            <div onClick={() => navigate('/exams')} className="bg-white border border-border rounded-r p-3.5 px-4 mb-3 cursor-pointer hover:border-primary-mid hover:shadow-sm transition-all shadow-xs">
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <div className="text-[13.5px] font-semibold text-text-1">Business Law</div>
                  <div className="text-[11.5px] text-text-3 mt-0.5">April 14th, 2026</div>
                </div>
                <span className="text-[12px] font-bold text-primary bg-primary-light rounded-md px-2 py-[3px] shrink-0">35 days</span>
              </div>
              <div className="h-1 bg-bg rounded-[2px] overflow-hidden mb-2">
                <div className="h-full rounded-[2px] bg-primary transition-[width] duration-300 w-[15%]"></div>
              </div>
              <div className="text-[11.5px] text-text-2 flex gap-1.5 items-start">
                <span className="text-primary font-bold shrink-0">→</span>
                Today: Contract law fundamentals (Ch. 1–3)
              </div>
            </div>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-r p-3.5 px-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#92400E] mb-1.5">⚠ Schedule Alert</div>
              <div className="text-[12.5px] text-[#78350F] leading-relaxed">This Friday has <strong>8hrs of committed work</strong> — more than realistic for one day. Consider starting the Law case study today.</div>
              <button onClick={() => navigate('/chat')} className="mt-[11px] text-[12px] bg-white border border-border2 text-text-2 px-3 py-1.5 rounded-rs font-semibold shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all cursor-pointer">
                Ask Claude for help →
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
