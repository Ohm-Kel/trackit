import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Exams() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-7 px-8 pb-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text-1 tracking-[-0.3px]">Exam Countdown</h1>
          <p className="text-[13px] text-text-3 mt-[3px]">2 exams tracked · revision plans active</p>
        </div>
        <button 
          onClick={() => navigate('/add?tab=exam')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[13px] font-semibold transition-all shadow-xs border-none cursor-pointer"
        >
          <Plus className="w-[13px] h-[13px]" />
          Add Exam
        </button>
      </div>

      <div className="px-8 pb-9">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          
          {/* Card 1 */}
          <div className="bg-white border border-border rounded-r p-5.5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[18px] font-bold text-text-1">Data Structures</div>
                <div className="text-[12px] text-text-3 mt-[3px]">CS 301 · April 2nd, 2026</div>
              </div>
              <div className="text-right">
                <div className="text-[30px] font-bold text-primary leading-none">23</div>
                <div className="text-[10.5px] text-text-3 mt-0.5">days left</div>
              </div>
            </div>
            
            <div className="h-[5px] bg-bg rounded-[3px] overflow-hidden my-2.5">
              <div className="h-full rounded-[3px] bg-primary w-[35%]"></div>
            </div>
            <div className="flex justify-between text-[11px] text-text-3 mb-3.5">
              <span>35% prepared</span>
              <span>Exam day</span>
            </div>
            
            <div className="flex items-center justify-between mb-3.5 pb-3.5 border-b border-border">
              <span className="text-[12px] font-semibold text-text-2">Confidence</span>
              <span className="bg-[#FFFBEB] text-[#D97706] inline-flex items-center text-[11px] font-semibold px-2 py-[2px] rounded-[20px] tracking-[0.01em]">Medium</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Revision Plan</div>
              
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium line-through">Day 1–3</div>
                <div className="text-text-3 line-through leading-relaxed">Arrays, linked lists, stacks & queues</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium line-through">Day 4–6</div>
                <div className="text-text-3 line-through leading-relaxed">Binary trees and BST operations</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-primary w-[50px] shrink-0 pt-[1px] font-bold">Day 7–9</div>
                <div className="text-text-1 font-semibold leading-relaxed">Graph traversal: BFS, DFS, Dijkstra's algorithm</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 10–14</div>
                <div className="text-text-2 leading-relaxed">Sorting & searching algorithms</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 15–20</div>
                <div className="text-text-2 leading-relaxed">Past papers & timed practice sessions</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 21–23</div>
                <div className="text-text-2 leading-relaxed">Final review and rest before exam</div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <button onClick={() => navigate('/chat')} className="flex-1 bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Ask Claude</button>
              <button className="flex-1 bg-primary text-white border-none px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-primary-hover transition-colors">Mark Today Done ✓</button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-border rounded-r p-5.5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[18px] font-bold text-text-1">Business Law</div>
                <div className="text-[12px] text-text-3 mt-[3px]">BL 202 · April 14th, 2026</div>
              </div>
              <div className="text-right">
                <div className="text-[30px] font-bold text-primary leading-none">35</div>
                <div className="text-[10.5px] text-text-3 mt-0.5">days left</div>
              </div>
            </div>
            
            <div className="h-[5px] bg-bg rounded-[3px] overflow-hidden my-2.5">
              <div className="h-full rounded-[3px] bg-primary w-[15%]"></div>
            </div>
            <div className="flex justify-between text-[11px] text-text-3 mb-3.5">
              <span>15% prepared</span>
              <span>Exam day</span>
            </div>
            
            <div className="flex items-center justify-between mb-3.5 pb-3.5 border-b border-border">
              <span className="text-[12px] font-semibold text-text-2">Confidence</span>
              <span className="bg-[#FEF2F2] text-[#EF4444] inline-flex items-center text-[11px] font-semibold px-2 py-[2px] rounded-[20px] tracking-[0.01em]">Low</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Revision Plan</div>
              
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-primary w-[50px] shrink-0 pt-[1px] font-bold">Day 1–3</div>
                <div className="text-text-1 font-semibold leading-relaxed">Contract fundamentals (Ch. 1–3)</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 4–7</div>
                <div className="text-text-2 leading-relaxed">Offer, acceptance, and consideration</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 8–12</div>
                <div className="text-text-2 leading-relaxed">Tort law and negligence principles</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 13–18</div>
                <div className="text-text-2 leading-relaxed">Corporate law, agency, partnerships</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 19–28</div>
                <div className="text-text-2 leading-relaxed">Case study analysis & essay practice</div>
              </div>
              <div className="flex gap-2.5 text-[12.5px] items-start">
                <div className="text-[11px] text-text-3 w-[50px] shrink-0 pt-[1px] font-medium">Day 29–35</div>
                <div className="text-text-2 leading-relaxed">Final review, past papers, exam strategy</div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <button onClick={() => navigate('/chat')} className="flex-1 bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Ask Claude</button>
              <button className="flex-1 bg-primary text-white border-none px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-primary-hover transition-colors">Mark Today Done ✓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
