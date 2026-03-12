import { Send, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';

function daysLabel(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff}d`;
}

function dotColor(task) {
  const d = Math.ceil((new Date(task.due_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
  if (d <= 1) return '#EF4444';
  if (d <= 4) return '#F59E0B';
  return '#22C55E';
}

const INITIAL_MESSAGES = [
  { role: 'ai', text: 'Hey! I can see your full schedule and workload.\n\nAsk me anything about your tasks, exams, or what to work on next — I\'ll give you the most strategic advice based on deadlines and grade weights.' }
];

export default function Chat() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: exams = [], isLoading: examsLoading } = useExams();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const activeTasks = tasks.filter(t => {
    const s = (t.status || '').toLowerCase();
    return !s.includes('done') && !s.includes('complet');
  });
  const upcomingExams = exams.filter(e => {
    const diff = Math.ceil((new Date(e.exam_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
    return diff >= 0;
  });

  function sendMessage() {
    if (!input.trim()) return;
    setMessages(m => [...m, { role: 'user', text: input }]);
    const userMsg = input;
    setInput('');
    // Simulated AI response (will be replaced with real API call when AI is integrated)
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'ai',
        text: `I can see you asked: "${userMsg}"\n\nThe AI integration is coming soon! For now, check your ${activeTasks.length} active tasks on the Tasks page, and your ${upcomingExams.length} upcoming exam${upcomingExams.length !== 1 ? 's' : ''} on the Exam Countdown page.`
      }]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 600);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickPrompts = [
    'What\'s my riskiest task?',
    'Am I on track for my exams?',
    'Help me prioritise my week',
    'What can I safely delay?'
  ];

  return (
    <div className="h-full flex flex-col pt-5 md:pt-7 animate-[fadeIn_0.2s_ease]">
      <div className="px-4 md:px-8 mb-4">
        <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">AI Workload Chat</h1>
        <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">Ask anything about your schedule, exams, or what to do next</p>
      </div>

      <div className="flex-1 px-4 md:px-8 pb-4 md:pb-6 grid grid-cols-1 md:grid-cols-[1fr_256px] gap-5 min-h-0 overflow-hidden">

        {/* Chat Main Area */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto py-1 pb-3.5 flex flex-col gap-3.5 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${msg.role === 'ai' ? 'bg-primary text-white' : 'bg-primary-light text-primary'}`}>
                  {msg.role === 'ai' ? 'T' : 'U'}
                </div>
                <div>
                  <div className={`max-w-[85%] md:max-w-[80%] p-3 px-3.5 rounded-xl text-[13px] md:text-[13.5px] leading-relaxed whitespace-pre-line ${msg.role === 'ai' ? 'bg-white border border-border text-text-1 rounded-tl-sm shadow-xs' : 'bg-primary text-white rounded-tr-sm ml-auto text-left'}`}>
                    {msg.text}
                  </div>
                  <div className={`text-[10px] text-text-3 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-[7px] mb-3 mt-2">
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => setInput(p)}
                className="bg-white border border-border rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium text-text-2 cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-faint"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-[1.5px] border-border rounded-r p-3 px-3.5 transition-colors focus-within:border-primary shadow-xs">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border-none outline-none resize-none font-sans text-[13.5px] text-text-1 bg-transparent min-h-[20px] max-h-[80px] leading-relaxed placeholder:text-text-3"
              placeholder="Ask anything about your workload…"
              rows="1"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-text-3 hidden sm:block">Enter to send · Shift+Enter for new line</span>
              <button onClick={sendMessage} className="bg-primary hover:bg-primary-hover border-none w-[30px] h-[30px] rounded-[7px] cursor-pointer flex items-center justify-center transition-colors shrink-0 ml-auto">
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Context Sidebar — hidden on mobile */}
        <div className="hidden md:flex flex-col gap-3.5 py-1 pb-3.5 overflow-y-auto custom-scrollbar">

          <div className="bg-white border border-border rounded-r p-[15px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Tasks in Context</div>
            {tasksLoading ? (
              <div className="flex items-center gap-2 text-[12px] text-text-3"><Loader2 className="w-3 h-3 animate-spin text-primary" />Loading…</div>
            ) : activeTasks.length === 0 ? (
              <div className="text-[12px] text-text-3 italic">No active tasks</div>
            ) : activeTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-b-0 text-[12.5px]">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotColor(task) }}></div>
                <div className="flex-1 font-medium text-text-1 truncate">{task.title}</div>
                <div className="text-[11px] text-text-3 font-medium shrink-0">{daysLabel(task.due_date)}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-border rounded-r p-[15px] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-text-3 mb-2.5">Exams in Context</div>
            {examsLoading ? (
              <div className="flex items-center gap-2 text-[12px] text-text-3"><Loader2 className="w-3 h-3 animate-spin text-primary" />Loading…</div>
            ) : upcomingExams.length === 0 ? (
              <div className="text-[12px] text-text-3 italic">No upcoming exams</div>
            ) : upcomingExams.slice(0, 4).map(exam => {
              const days = Math.ceil((new Date(exam.exam_date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
              return (
                <div key={exam.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-b-0 text-[12.5px]">
                  <span className="bg-primary-light text-primary text-[10px] font-bold px-1.5 py-[1px] rounded shrink-0">{days}d</span>
                  <div className="flex-1 font-medium text-text-1 truncate">{exam.subject}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-primary-faint border border-primary-mid rounded-r p-[15px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-primary mb-2">✦ AI Coming Soon</div>
            <div className="text-[12px] text-text-2 leading-relaxed">Real AI responses powered by Claude are being integrated. For now, responses are simulated.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
