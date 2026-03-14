const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../supabaseClient');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/chat
 * Body: { message: string, history: [{ role: 'user'|'ai', text: string }] }
 *
 * Fetches the authenticated user's tasks and exams, then calls Claude with
 * that context so responses are grounded in the student's actual workload.
 */
exports.chat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch tasks and exams in parallel for context
    const [tasksResult, examsResult] = await Promise.all([
      supabase
        .from('tasks')
        .select('title, status, due_date, grade_weight, estimated_hours, course_code, description')
        .eq('user_id', userId)
        .order('due_date', { ascending: true }),
      supabase
        .from('exams')
        .select('subject, exam_date, confidence_level, topics, course_code')
        .eq('user_id', userId)
        .order('exam_date', { ascending: true }),
    ]);

    const tasks = tasksResult.data || [];
    const exams = examsResult.data || [];
    const today = new Date().toISOString().split('T')[0];

    // Categorize tasks for richer context
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today);
    const stuckTasks = tasks.filter(t => t.status === 'stuck');
    const activeTasks = tasks.filter(t => t.status !== 'done');

    const taskLines = tasks.length === 0
      ? '  (no tasks yet)'
      : tasks.map(t => {
          const isOverdue = t.status !== 'done' && t.due_date && t.due_date < today;
          return `  • "${t.title}" | status: ${t.status}${isOverdue ? ' ⚠️ OVERDUE' : ''} | due: ${t.due_date || 'not set'}` +
          (t.grade_weight ? ` | weight: ${t.grade_weight}%` : '') +
          (t.estimated_hours ? ` | effort: ${t.estimated_hours}h` : '') +
          (t.course_code ? ` | course: ${t.course_code}` : '') +
          (t.description ? ` | notes: ${t.description.substring(0, 80)}` : '');
        }).join('\n');

    const examLines = exams.length === 0
      ? '  (no exams yet)'
      : exams.map(e => {
          const daysLeft = e.exam_date ? Math.ceil((new Date(e.exam_date) - new Date(today)) / 86400000) : null;
          return `  • "${e.subject}" | date: ${e.exam_date || 'not set'}` +
          (daysLeft !== null ? ` | ${daysLeft} days left` : '') +
          ` | confidence: ${e.confidence_level}` +
          (Array.isArray(e.topics) && e.topics.length ? ` | topics: ${e.topics.join(', ')}` : '');
        }).join('\n');

    // Build alert sections
    let alerts = '';
    if (overdueTasks.length > 0) {
      alerts += `\n⚠️ OVERDUE TASKS (${overdueTasks.length}): ${overdueTasks.map(t => `"${t.title}"`).join(', ')}\n`;
    }
    if (stuckTasks.length > 0) {
      alerts += `\n🚧 STUCK TASKS (${stuckTasks.length}): ${stuckTasks.map(t => `"${t.title}"`).join(', ')}` +
        `\nFor stuck tasks, suggest: breaking into smaller steps, changing approach, asking for help, or identifying the specific blocker.\n`;
    }

    const systemPrompt =
      `You are Trackit's AI study assistant. Today is ${today}.\n` +
      `Student has ${activeTasks.length} active task(s) and ${exams.length} exam(s).` +
      alerts +
      `\nStudent's tasks:\n${taskLines}\n\n` +
      `Student's exams:\n${examLines}\n\n` +
      `Guidelines:\n` +
      `- Give strategic, actionable advice grounded in the data above.\n` +
      `- Prioritise by urgency (due date) and academic importance (grade weight).\n` +
      `- Be encouraging but realistic. Flag overdue or high-risk items clearly.\n` +
      `- For stuck tasks, proactively suggest unblocking strategies: break the task into subtasks, try a different approach, seek help from peers/tutors, or timebox the difficult part.\n` +
      `- Keep responses concise (under 180 words) unless deep detail is explicitly requested.\n` +
      `- Use plain text; avoid markdown headers. Short bullet lists are fine.`;

    // Convert frontend history format to Anthropic messages format.
    // Skip the initial AI greeting from INITIAL_MESSAGES (role 'ai') as it is
    // not part of the real conversation and would confuse the model.
    const messages = [
      ...history
        .filter((m) => !(m.role === 'ai' && history.indexOf(m) === 0))
        .map((m) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
      { role: 'user', content: message.trim() },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0]?.text || 'Sorry, I could not generate a response.';

    // Persist both the user message and AI reply to chat_history
    await supabase.from('chat_history').insert([
      { user_id: userId, role: 'user', content: message.trim() },
      { user_id: userId, role: 'assistant', content: reply },
    ]);

    res.json({ reply });
  } catch (err) {
    console.error('Chat controller error:', err);
    res.status(500).json({ error: 'Failed to generate AI response. Please try again.' });
  }
};

/**
 * GET /api/chat/history
 * Returns the user's persisted chat messages, ordered chronologically.
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('chat_history')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('Get chat history error:', err);
    res.status(500).json({ error: 'Failed to load chat history.' });
  }
};

/**
 * DELETE /api/chat/history
 * Clears the user's chat history.
 */
exports.clearHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Clear chat history error:', err);
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
};
