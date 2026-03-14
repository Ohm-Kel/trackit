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

    const taskLines = tasks.length === 0
      ? '  (no tasks yet)'
      : tasks.map(t =>
          `  • "${t.title}" | status: ${t.status} | due: ${t.due_date || 'not set'}` +
          (t.grade_weight ? ` | weight: ${t.grade_weight}%` : '') +
          (t.estimated_hours ? ` | effort: ${t.estimated_hours}h` : '') +
          (t.course_code ? ` | course: ${t.course_code}` : '')
        ).join('\n');

    const examLines = exams.length === 0
      ? '  (no exams yet)'
      : exams.map(e =>
          `  • "${e.subject}" | date: ${e.exam_date || 'not set'}` +
          ` | confidence: ${e.confidence_level}` +
          (Array.isArray(e.topics) && e.topics.length ? ` | topics: ${e.topics.join(', ')}` : '')
        ).join('\n');

    const systemPrompt =
      `You are Trackit's AI study assistant. Today is ${today}.\n\n` +
      `Student's active tasks:\n${taskLines}\n\n` +
      `Student's exams:\n${examLines}\n\n` +
      `Guidelines:\n` +
      `- Give strategic, actionable advice grounded in the data above.\n` +
      `- Prioritise by urgency (due date) and academic importance (grade weight).\n` +
      `- Be encouraging but realistic. Flag overdue or high-risk items clearly.\n` +
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
    res.json({ reply });
  } catch (err) {
    console.error('Chat controller error:', err);
    res.status(500).json({ error: 'Failed to generate AI response. Please try again.' });
  }
};
