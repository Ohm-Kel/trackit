import { Send, Loader2, Trash2 } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useExams } from '../hooks/useExams';
import { daysUntil } from '../utils/dates';
import { streamChatMessage, fetchChatHistory, clearChatHistory } from '../api/chat';

function daysLabel(dateStr) {
  const diff = daysUntil(dateStr);
  if (diff === null) return null;
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff}d`;
}

function dotColor(task) {
  const d = daysUntil(task.due_date);
  if (d === null || d <= 1) return '#EF4444';
  if (d <= 4) return '#F59E0B';
  return '#22C55E';
}

const clockTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const INITIAL_GREETING = { role: 'ai', text: 'Hey! I can see your full schedule and workload.\n\nAsk me anything about your tasks, exams, or what to work on next — I\'ll give you the most strategic advice based on deadlines and grade weights.' };

export default function Chat() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: exams = [], isLoading: examsLoading } = useExams();
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  // Stop an in-flight reply when leaving the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Load persisted history on mount
  useEffect(() => {
    let cancelled = false;
    fetchChatHistory().then(history => {
      if (cancelled || !history.length) {
        setHistoryLoaded(true);
        return;
      }
      const loaded = history.map(m => ({
        role: m.role === 'assistant' ? 'ai' : 'user',
        text: m.content,
        time: new Date(m.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }));
      setMessages([INITIAL_GREETING, ...loaded]);
      setHistoryLoaded(true);
    }).catch(() => {
      if (!cancelled) setHistoryLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (historyLoaded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, historyLoaded]);

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const upcomingExams = exams.filter(e => {
    const diff = daysUntil(e.exam_date);
    return diff !== null && diff >= 0;
  });

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg = input;
    const now = clockTime();
    setInput('');
    const userEntry = { role: 'user', text: userMsg, time: now };
    setMessages(m => [...m, userEntry]);
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Prior turns only: skip the static greeting and local error notices.
      // The new message is sent separately as `message`.
      const history = messages
        .filter((m, i) => i > 0 && !m.isError)
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

      // Grow a single reply bubble as fragments arrive.
      const { reply } = await streamChatMessage(userMsg, history, {
        signal: controller.signal,
        onDelta: text => setMessages(m => {
          const last = m[m.length - 1];
          if (last?.streaming) return [...m.slice(0, -1), { ...last, text: last.text + text }];
          return [...m, { role: 'ai', text, time: clockTime(), streaming: true }];
        }),
      });
      setMessages(m => {
        const last = m[m.length - 1];
        const final = { role: 'ai', text: reply, time: last?.streaming ? last.time : clockTime() };
        return last?.streaming ? [...m.slice(0, -1), final] : [...m, final];
      });
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(m => {
        // A partial reply was not saved, so keep it out of future history.
        const kept = m.map(msg => (msg.streaming ? { ...msg, streaming: false, isError: true } : msg));
        return [...kept, { role: 'ai', text: `Sorry, I couldn't get a response right now. ${err.message}`, time: now, isError: true }];
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSending(false);
    }
  }, [input, sending, messages]);

  async function handleClearHistory() {
    if (!window.confirm('Clear all chat history? This cannot be undone.')) return;
    try {
      await clearChatHistory();
      setMessages([INITIAL_GREETING]);
    } catch {
      // silently fail
    }
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
      <div className="px-4 md:px-8 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-[22px] font-bold text-text-1 tracking-[-0.3px]">AI Workload Chat</h1>
          <p className="text-[12px] md:text-[13px] text-text-3 mt-[3px]">Ask anything about your schedule, exams, or what to do next</p>
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border2 text-text-3 hover:text-[#B91C1C] hover:border-[#FCA5A5] rounded-rs text-[11px] font-semibold cursor-pointer transition-all"
            title="Clear chat history"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 px-4 md:px-8 pb-4 md:pb-6 grid grid-cols-1 md:grid-cols-[1fr_256px] gap-5 min-h-0 overflow-hidden">

        {/* Chat Main Area */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto py-1 pb-3.5 flex flex-col gap-3.5 custom-scrollbar">
            {!historyLoaded ? (
              <div className="flex flex-col gap-3.5 animate-pulse-soft">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`flex gap-2.5 items-start ${i === 2 ? 'flex-row-reverse' : ''}`}>
                    <div className="w-[30px] h-[30px] rounded-full bg-border shrink-0" />
                    <div className={`h-[60px] w-[60%] rounded-xl bg-bg border border-border ${i === 2 ? 'rounded-tr-sm' : 'rounded-tl-sm'}`} />
                  </div>
                ))}
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold ${msg.role === 'ai' ? 'bg-primary text-white' : 'bg-primary-light text-primary'}`}>
                    {msg.role === 'ai' ? 'T' : 'U'}
                  </div>
                  <div className={msg.role === 'user' ? 'ml-auto' : ''}>
                    <div className={`max-w-[85%] md:max-w-[80%] p-3 px-3.5 rounded-xl text-[13px] md:text-[13.5px] leading-relaxed whitespace-pre-line ${msg.role === 'ai' ? 'bg-white border border-border text-text-1 rounded-tl-sm shadow-xs' : 'bg-primary text-white rounded-tr-sm ml-auto text-left'}`}>
                      {msg.text}
                    </div>
                    <div className={`text-[10px] text-text-3 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {msg.time || ''}
                    </div>
                  </div>
                </div>
              ))
            )}
            {sending && !messages[messages.length - 1]?.streaming && (
              <div className="flex gap-2.5 items-start">
                <div className="w-[30px] h-[30px] rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold bg-primary text-white">T</div>
                <div className="bg-white border border-border rounded-xl rounded-tl-sm shadow-xs p-3 px-3.5 flex items-center gap-2 text-[13px] text-text-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-[7px] mb-3 mt-2">
            {quickPrompts.map(p => (
              <button
                key={p}
                onClick={() => setInput(p)}
                disabled={sending}
                className="bg-white border border-border rounded-[20px] px-3.5 py-1.5 text-[12px] font-medium text-text-2 cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-primary-faint disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-[1.5px] border-border rounded-r p-3 px-3.5 transition-colors focus-within:border-primary shadow-xs">
            <textarea
              aria-label="Message"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              className="w-full border-none outline-none resize-none font-sans text-[13.5px] text-text-1 bg-transparent min-h-[20px] max-h-[80px] leading-relaxed placeholder:text-text-3 disabled:opacity-50"
              placeholder="Ask anything about your workload…"
              rows="1"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-[11px] text-text-3 hidden sm:block">Enter to send · Shift+Enter for new line</span>
              <button onClick={sendMessage} aria-label="Send message" disabled={sending || !input.trim()} className="bg-primary hover:bg-primary-hover disabled:opacity-50 border-none w-[30px] h-[30px] rounded-[7px] cursor-pointer flex items-center justify-center transition-colors shrink-0 ml-auto">
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
              const days = daysUntil(exam.exam_date);
              return (
                <div key={exam.id} className="flex items-center gap-2 py-1.5 border-b border-border last:border-b-0 text-[12.5px]">
                  <span className="bg-primary-light text-primary text-[10px] font-bold px-1.5 py-[1px] rounded shrink-0">{days}d</span>
                  <div className="flex-1 font-medium text-text-1 truncate">{exam.subject}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-primary-faint border border-primary-mid rounded-r p-[15px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.07em] text-primary mb-2">Powered by Claude AI</div>
            <div className="text-[12px] text-text-2 leading-relaxed">Responses are generated using your real tasks and exams as context for personalised advice.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
