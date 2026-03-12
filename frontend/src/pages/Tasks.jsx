import { Plus, Search, Check, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Tasks() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState('st1');

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-7 px-8 pb-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text-1 tracking-[-0.3px]">All Tasks</h1>
          <p className="text-[13px] text-text-3 mt-[3px]">7 tasks tracked · 3 urgent · 2 in progress</p>
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
        <div className="flex items-center gap-2.5 mb-4.5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-text-3 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search tasks…" 
              className="w-full py-2 pr-3 pl-8 border-[1.5px] border-border rounded-rs font-sans text-[13px] text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3"
            />
          </div>
          <div className="flex gap-[6px] flex-wrap">
            <button onClick={() => setFilter('all')} className={`px-[13px] py-1 border-[1.5px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all font-sans ${filter === 'all' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-3 hover:border-primary-mid hover:text-primary'}`}>All</button>
            <button onClick={() => setFilter('urgent')} className={`px-[13px] py-1 border-[1.5px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all font-sans ${filter === 'urgent' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-3 hover:border-primary-mid hover:text-primary'}`}>Urgent</button>
            <button onClick={() => setFilter('inprogress')} className={`px-[13px] py-1 border-[1.5px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all font-sans ${filter === 'inprogress' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-3 hover:border-primary-mid hover:text-primary'}`}>In Progress</button>
            <button onClick={() => setFilter('notstarted')} className={`px-[13px] py-1 border-[1.5px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all font-sans ${filter === 'notstarted' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-3 hover:border-primary-mid hover:text-primary'}`}>Not Started</button>
            <button onClick={() => setFilter('done')} className={`px-[13px] py-1 border-[1.5px] rounded-[20px] text-[12px] font-semibold cursor-pointer transition-all font-sans ${filter === 'done' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-3 hover:border-primary-mid hover:text-primary'}`}>Done</button>
          </div>
          <select className="py-[7px] pl-2.5 pr-7 border-[1.5px] border-border rounded-rs font-sans text-[12px] text-text-2 bg-white outline-none cursor-pointer appearance-none transition-colors focus:border-primary" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394A3B8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 9px center'}}>
            <option>Sort: Priority</option>
            <option>Sort: Due Date</option>
            <option>Sort: Effort</option>
            <option>Sort: Grade Weight</option>
          </select>
        </div>

        <div className="bg-white border border-border rounded-r shadow-xs overflow-hidden">
          <div className="grid grid-cols-[32px_1fr_100px_80px_90px_90px_36px] py-2.5 px-4 bg-bg border-b border-border text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 gap-2 items-center">
            <div></div>
            <div>Task</div>
            <div>Due</div>
            <div>Effort</div>
            <div>Weight</div>
            <div>Status</div>
            <div></div>
          </div>

          {/* Row 1 */}
          <div onClick={() => setExpandedRow(expandedRow === 'st1' ? null : 'st1')} className={`grid grid-cols-[32px_1fr_100px_80px_90px_90px_36px] py-3 px-4 border-b border-border items-center gap-2 cursor-pointer transition-colors ${expandedRow === 'st1' ? 'bg-primary-faint' : 'hover:bg-bg'}`}>
            <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-border2 bg-white shrink-0 mt-[2px] hover:border-primary hover:bg-primary-light transition-colors" onClick={(e) => e.stopPropagation()}></div>
            <div className="min-w-0 pr-2">
              <div className="text-[13.5px] font-semibold text-text-1 whitespace-nowrap overflow-hidden text-ellipsis">Data Structures — Assignment 3</div>
              <div className="text-[11.5px] text-text-3 mt-0.5">CS 301 · <span className="text-primary font-semibold">3 subtasks</span></div>
            </div>
            <div className="text-[12.5px] text-text-2"><span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#EF4444] tracking-[0.01em]">Tomorrow</span></div>
            <div className="text-[12.5px] text-text-1 font-semibold">4 hrs</div>
            <div className="text-[12.5px] text-text-1 font-semibold">25%</div>
            <div className="text-[12.5px] text-text-2"><span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary tracking-[0.01em]">In Progress</span></div>
            <div className="flex gap-1">
              <button className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-primary-light hover:text-primary" onClick={(e) => { e.stopPropagation(); }}>
                <Edit2 className="w-[13px] h-[13px]" />
              </button>
            </div>
          </div>
          
          {expandedRow === 'st1' && (
            <div className="py-2.5 px-4 pl-12 bg-primary-faint border-b border-primary-mid">
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-primary mb-2.5">✦ AI-Generated Subtasks</div>
              
              <div className="flex items-center gap-2.5 py-1.5 border-b border-primary-mid text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary flex shrink-0 cursor-pointer items-center justify-center bg-primary transition-colors">
                  <Check className="w-2 h-2 text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 text-text-3 font-medium line-through">Review graph traversal theory (BFS, DFS)</div>
                <div className="text-[11px] text-text-3">45 min</div>
              </div>
              
              <div className="flex items-center gap-2.5 py-1.5 border-b border-primary-mid text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary flex shrink-0 cursor-pointer items-center justify-center bg-primary transition-colors">
                  <Check className="w-2 h-2 text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 text-text-3 font-medium line-through">Implement Dijkstra's algorithm with test cases</div>
                <div className="text-[11px] text-text-3">1.5 hr</div>
              </div>
              
              <div className="flex items-center gap-2.5 py-1.5 text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary-mid flex shrink-0 cursor-pointer items-center justify-center bg-white transition-colors"></div>
                <div className="flex-1 text-text-1 font-medium">Write analysis section + submit on LMS</div>
                <div className="text-[11px] text-text-3">45 min</div>
              </div>
            </div>
          )}

          {/* Row 2 */}
          <div onClick={() => setExpandedRow(expandedRow === 'st2' ? null : 'st2')} className={`grid grid-cols-[32px_1fr_100px_80px_90px_90px_36px] py-3 px-4 border-b border-border items-center gap-2 cursor-pointer transition-colors ${expandedRow === 'st2' ? 'bg-primary-faint' : 'hover:bg-bg'}`}>
            <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-border2 bg-white shrink-0 mt-[2px] hover:border-primary hover:bg-primary-light transition-colors" onClick={(e) => e.stopPropagation()}></div>
            <div className="min-w-0 pr-2">
              <div className="text-[13.5px] font-semibold text-text-1 whitespace-nowrap overflow-hidden text-ellipsis">Business Law — Case Study Analysis</div>
              <div className="text-[11.5px] text-text-3 mt-0.5">BL 202 · <span className="text-primary font-semibold">4 subtasks</span></div>
            </div>
            <div className="text-[12.5px] text-text-2"><span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] tracking-[0.01em]">Friday</span></div>
            <div className="text-[12.5px] text-text-2">5 hrs</div>
            <div className="text-[12.5px] text-text-2">30%</div>
            <div className="text-[12.5px] text-text-2"><span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg border border-border tracking-[0.01em] text-text-3">Not Started</span></div>
            <div className="flex gap-1">
              <button className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-primary-light hover:text-primary" onClick={(e) => { e.stopPropagation(); }}>
                <Edit2 className="w-[13px] h-[13px]" />
              </button>
            </div>
          </div>

          {expandedRow === 'st2' && (
            <div className="py-2.5 px-4 pl-12 bg-primary-faint border-b border-primary-mid">
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-primary mb-2.5">✦ AI-Generated Subtasks</div>
              
              <div className="flex items-center gap-2.5 py-1.5 border-b border-primary-mid text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary-mid flex shrink-0 cursor-pointer items-center justify-center bg-white transition-colors"></div>
                <div className="flex-1 text-text-1 font-medium">Read and annotate the case facts (Carlill v Carbolic)</div>
                <div className="text-[11px] text-text-3">1 hr</div>
              </div>
              
              <div className="flex items-center gap-2.5 py-1.5 border-b border-primary-mid text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary-mid flex shrink-0 cursor-pointer items-center justify-center bg-white transition-colors"></div>
                <div className="flex-1 text-text-1 font-medium">Identify legal issues: offer, acceptance, consideration</div>
                <div className="text-[11px] text-text-3">45 min</div>
              </div>
              
              <div className="flex items-center gap-2.5 py-1.5 border-b border-primary-mid text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary-mid flex shrink-0 cursor-pointer items-center justify-center bg-white transition-colors"></div>
                <div className="flex-1 text-text-1 font-medium">Research supporting precedent cases</div>
                <div className="text-[11px] text-text-3">1.5 hr</div>
              </div>
              
              <div className="flex items-center gap-2.5 py-1.5 text-[13px]">
                <div className="w-[15px] h-[15px] rounded-[4px] border-[1.5px] border-primary-mid flex shrink-0 cursor-pointer items-center justify-center bg-white transition-colors"></div>
                <div className="flex-1 text-text-1 font-medium">Write and format final analysis (1500 words)</div>
                <div className="text-[11px] text-text-3">1.5 hr</div>
              </div>
            </div>
          )}

          {/* Row 3 - Completed */}
          <div className="grid grid-cols-[32px_1fr_100px_80px_90px_90px_36px] py-3 px-4 items-center gap-2 cursor-pointer transition-colors hover:bg-bg opacity-[0.55]">
            <div className="w-[17px] h-[17px] rounded-full border-[1.5px] border-primary bg-primary shrink-0 mt-[2px] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
            <div className="min-w-0 pr-2">
              <div className="text-[13.5px] font-semibold text-text-3 line-through whitespace-nowrap overflow-hidden text-ellipsis">Statistics — Problem Set 4</div>
              <div className="text-[11.5px] text-text-3 mt-0.5">STAT 201 · completed</div>
            </div>
            <div className="text-[12.5px] text-text-3">Mar 8</div>
            <div className="text-[12.5px] text-text-3">2 hrs</div>
            <div className="text-[12.5px] text-text-3">15%</div>
            <div className="text-[12.5px] text-text-2"><span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] tracking-[0.01em]">Done</span></div>
            <div className="flex gap-1">
              <button className="w-[26px] h-[26px] rounded-md border-none bg-transparent cursor-pointer flex items-center justify-center text-text-3 transition-colors hover:bg-primary-light hover:text-primary" onClick={(e) => { e.stopPropagation(); }}>
                <Edit2 className="w-[13px] h-[13px]" />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
