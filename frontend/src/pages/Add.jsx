import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Add() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'exam' ? 'exam' : 'task';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [confidence, setConfidence] = useState('medium');
  const [topics, setTopics] = useState(['Differentiation', 'Integration', 'Limits']);
  const [topicInput, setTopicInput] = useState('');
  const [showParsed, setShowParsed] = useState(false);

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (indexToRemove) => {
    setTopics(topics.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-7 px-8 pb-0 flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text-1 tracking-[-0.3px]">Add New</h1>
          <p className="text-[13px] text-text-3 mt-[3px]">Describe your task or exam, or fill in the form manually</p>
        </div>
      </div>

      <div className="px-8 pb-9">
        <div className="flex gap-1 bg-bg p-1 rounded-[10px] mb-5.5 w-max border border-border">
          <button 
            onClick={() => setActiveTab('task')}
            className={`px-5 py-1.5 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all border-none ${activeTab === 'task' ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-3'}`}
          >
            📋 Assignment / Task
          </button>
          <button 
            onClick={() => setActiveTab('exam')}
            className={`px-5 py-1.5 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all border-none ${activeTab === 'exam' ? 'bg-white text-primary shadow-xs' : 'bg-transparent text-text-3'}`}
          >
            📝 Exam
          </button>
        </div>

        {activeTab === 'task' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="bg-white border-[1.5px] border-border rounded-r p-4 mb-4.5 transition-colors focus-within:border-primary shadow-xs">
                <div className="text-[11px] font-semibold text-primary mb-2 uppercase tracking-[0.06em]">✦ Describe in plain English</div>
                <textarea 
                  className="w-full border-none outline-none resize-none font-sans text-[13.5px] text-text-1 bg-transparent leading-relaxed min-h-[64px] placeholder:text-text-3" 
                  placeholder="e.g. 'Stats assignment due this Friday, worth 30%, about 4 hours of work, haven't started yet…'"
                ></textarea>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-border">
                  <span className="text-[11px] text-text-3">Claude parses all details automatically</span>
                  <button onClick={() => setShowParsed(true)} className="bg-primary text-white border-none px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:bg-primary-hover transition-colors">Parse with AI</button>
                </div>
              </div>

              {showParsed && (
                <div className="bg-primary-faint border border-primary-mid rounded-rs p-3 mb-4.5">
                  <div className="text-[11px] font-semibold text-primary mb-2">✓ Claude parsed this as:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Task:</b> Statistics Assignment</div>
                    <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Due:</b> Friday Mar 14</div>
                    <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Weight:</b> 30%</div>
                    <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Est:</b> 4 hrs</div>
                    <div className="bg-white border border-primary-mid rounded-md px-2 py-0.5 text-[12px] text-text-1"><b className="text-primary font-bold">Status:</b> Not started</div>
                  </div>
                </div>
              )}

              <div className="text-center text-[11.5px] text-text-3 my-3 mb-4.5 relative before:content-[''] before:absolute before:top-1/2 before:w-[42%] before:h-px before:bg-border before:left-0 after:content-[''] after:absolute after:top-1/2 after:w-[42%] after:h-px after:bg-border after:right-0">or fill in manually</div>
              
              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Task Name</label>
                <input type="text" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" placeholder="e.g. Statistics Assignment 2" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Due Date</label>
                  <input type="date" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Course Code</label>
                  <input type="text" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" placeholder="e.g. STAT 201" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Grade Weight (%)</label>
                  <input type="number" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" placeholder="25" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Estimated Hours</label>
                  <input type="number" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" placeholder="4" step="0.5" />
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Status</label>
                <select className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary">
                  <option>Not started</option>
                  <option>In progress</option>
                  <option>Stuck / blocked</option>
                </select>
              </div>
            </div>

            <div>
              <div className="bg-white border border-border rounded-r p-4.5 mb-3.5 shadow-xs">
                <div className="text-[12px] font-bold text-text-2 mb-2.5 uppercase tracking-[0.05em]">Priority Preview</div>
                <div className="text-[13px] text-text-2 leading-relaxed mb-3">Fill in the details and Claude will rank this task in your current queue.</div>
                <div className="bg-bg rounded-rs p-3 border border-border">
                  <div className="text-[12px] font-semibold text-text-2 mb-1.5">Current #1 Priority</div>
                  <div className="text-[13.5px] font-bold text-text-1">Data Structures — Due Tomorrow</div>
                  <div className="text-[11.5px] text-text-3 mt-1">Your new task slots in after AI analysis</div>
                </div>
              </div>
              
              <div className="bg-white border border-border rounded-r p-4.5 mb-3.5 shadow-xs">
                <div className="text-[12px] font-bold text-text-2 mb-2.5 uppercase tracking-[0.05em]">Tips for Better Prioritisation</div>
                <div className="text-[13px] text-text-2 leading-[1.9]">
                  <div>· Grade weight matters — 5% quiz ranks below 40% exam</div>
                  <div>· Mark "stuck" to get Claude's specific help</div>
                  <div>· More detail = smarter priority reasoning</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exam' && (
          <div className="grid grid-cols-2 gap-6">
             <div>
              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Subject / Course Name</label>
                <input type="text" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" placeholder="e.g. Calculus II" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3.5">
                <div>
                  <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Exam Date</label>
                  <input type="date" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary" />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Course Code</label>
                  <input type="text" className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" placeholder="e.g. MATH 201" />
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Confidence Level</label>
                <div className="flex gap-2">
                  <button onClick={() => setConfidence('low')} className={`flex-1 p-[9px] border-[1.5px] rounded-rs text-center cursor-pointer text-[13px] font-semibold transition-all font-sans ${confidence === 'low' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-2 hover:border-primary-mid hover:text-primary'}`}>😰 Low</button>
                  <button onClick={() => setConfidence('medium')} className={`flex-1 p-[9px] border-[1.5px] rounded-rs text-center cursor-pointer text-[13px] font-semibold transition-all font-sans ${confidence === 'medium' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-2 hover:border-primary-mid hover:text-primary'}`}>😐 Medium</button>
                  <button onClick={() => setConfidence('high')} className={`flex-1 p-[9px] border-[1.5px] rounded-rs text-center cursor-pointer text-[13px] font-semibold transition-all font-sans ${confidence === 'high' ? 'bg-primary-light border-primary text-primary' : 'bg-white border-border text-text-2 hover:border-primary-mid hover:text-primary'}`}>😊 High</button>
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Topics to Revise</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTopic(); }}
                    className="flex-1 p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary placeholder:text-text-3" 
                    placeholder="e.g. Integration by parts" 
                  />
                  <button onClick={handleAddTopic} className="bg-white text-text-2 border border-border2 px-3 py-1.5 rounded-rs text-[12px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {topics.map((topic, idx) => (
                    <span key={idx} className="bg-primary-light rounded-[20px] px-2.5 py-[3px] text-[12px] text-primary flex items-center gap-1.5 font-medium">
                      {topic} 
                      <span onClick={() => handleRemoveTopic(idx)} className="cursor-pointer text-primary-mid text-[14px] leading-none font-normal hover:text-primary">×</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-3.5">
                <label className="text-[12px] font-semibold text-text-2 mb-1.5 block">Daily Study Time Available</label>
                <select className="w-full p-[9px] px-3 border-[1.5px] border-border rounded-rs text-[13.5px] font-sans text-text-1 bg-white outline-none transition-colors focus:border-primary">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>1–2 hours</option>
                  <option>2–3 hours</option>
                  <option>3+ hours</option>
                </select>
              </div>
            </div>
            
            <div>
              <div className="bg-white border border-border rounded-r p-4.5 mb-3.5 shadow-xs">
                <div className="text-[12px] font-bold text-text-2 mb-2.5 uppercase tracking-[0.05em]">Revision Plan Preview</div>
                <div className="text-[13px] text-text-2 leading-relaxed mb-3.5">Claude generates a day-by-day revision schedule counting back from your exam date.</div>
                <div className="bg-bg rounded-rs p-3 border border-border">
                  <div className="text-[13px] text-text-2 leading-[2.0]">
                    <div><span className="font-bold text-primary">Week 1:</span> Core concepts — Differentiation, Limits</div>
                    <div><span className="font-bold text-primary">Week 2:</span> Problem solving — Integration</div>
                    <div><span className="font-bold text-primary">Week 3:</span> Past papers + weak area review</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 mt-5.5 pt-5 border-t border-border">
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-rs text-[13px] font-semibold shadow-xs border-none cursor-pointer transition-colors">
            {activeTab === 'task' ? 'Save Task' : 'Save & Generate Plan'}
          </button>
          {activeTab === 'task' && (
            <button className="bg-white text-text-2 border border-border2 px-4 py-2 rounded-rs text-[13px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Save & Add Another</button>
          )}
          <button onClick={() => navigate('/dashboard')} className="bg-white text-text-2 border border-border2 px-4 py-2 rounded-rs text-[13px] font-semibold cursor-pointer shadow-xs hover:border-primary hover:text-primary hover:bg-primary-faint transition-all">Cancel</button>
        </div>

      </div>
    </div>
  );
}
