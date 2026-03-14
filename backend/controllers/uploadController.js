const Anthropic = require('@anthropic-ai/sdk');
const supabase = require('../supabaseClient');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EXAM_PARSE_PROMPT = `You are parsing an exam timetable document. Extract ALL exams you can find.

Return ONLY a JSON array (no markdown, no explanation) where each element has:
{
  "subject": "Course name",
  "course_code": "e.g. MATH 201" or null,
  "exam_date": "YYYY-MM-DD" or null,
  "exam_time": "e.g. 9:00 AM" or null,
  "venue": "e.g. Room 101" or null
}

If you cannot find any exams, return an empty array [].
Return ONLY the JSON array, nothing else.`;

const SCHEDULE_PARSE_PROMPT = `You are parsing a class/lecture schedule. Extract the weekly schedule.

Return ONLY a JSON object (no markdown, no explanation) with this structure:
{
  "monday": [{"start": "08:00", "end": "10:00", "subject": "Math 201", "venue": "Room A"}],
  "tuesday": [...],
  "wednesday": [...],
  "thursday": [...],
  "friday": [...],
  "saturday": [],
  "sunday": []
}

Times should be in 24-hour "HH:MM" format. If a day has no classes, use an empty array.
If you cannot parse the schedule, return an object with all empty arrays.
Return ONLY the JSON object, nothing else.`;

function getMediaType(mimeType) {
  const map = {
    'application/pdf': 'application/pdf',
    'image/png': 'image/png',
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
  };
  return map[mimeType] || null;
}

/**
 * POST /api/upload/parse
 * Body: { file: base64string, mimeType: string, type: 'exam' | 'schedule' }
 */
exports.parseUpload = async (req, res) => {
  try {
    const { file, mimeType, type } = req.body;

    if (!file || !mimeType) {
      return res.status(400).json({ error: 'File data and mimeType are required' });
    }

    const mediaType = getMediaType(mimeType);
    if (!mediaType) {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, PNG, or JPG.' });
    }

    const prompt = type === 'schedule' ? SCHEDULE_PARSE_PROMPT : EXAM_PARSE_PROMPT;

    // Build the content block based on file type
    const contentBlock = mediaType === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: file } }
      : { type: 'image', source: { type: 'base64', media_type: mediaType, data: file } };

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const rawText = response.content[0]?.text || '[]';

    // Parse the JSON from Claude's response
    let parsed;
    try {
      // Strip potential markdown code fences
      const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(422).json({
        error: 'Could not parse the document. Please try a clearer image or PDF.',
        raw: rawText,
      });
    }

    res.json({ type, data: parsed });
  } catch (err) {
    console.error('Upload parse error:', err);
    if (err.status === 401 || err.message?.includes('authentication') || err.message?.includes('API key')) {
      return res.status(500).json({ error: 'AI service is not configured. Please contact the administrator to set up the ANTHROPIC_API_KEY.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: 'AI service is temporarily busy. Please wait a moment and try again.' });
    }
    if (err.message?.includes('too large') || err.message?.includes('size')) {
      return res.status(413).json({ error: 'File is too large for AI processing. Try a smaller file or compress the image.' });
    }
    res.status(500).json({ error: 'Failed to parse document. Please try again.' });
  }
};

/**
 * POST /api/upload/import-exams
 * Body: { exams: [{ subject, course_code, exam_date, exam_time, venue }] }
 * Creates exam records for the authenticated user.
 */
exports.importExams = async (req, res) => {
  try {
    const userId = req.user.id;
    const { exams } = req.body;

    if (!Array.isArray(exams) || exams.length === 0) {
      return res.status(400).json({ error: 'No exams to import' });
    }

    const rows = exams.map(e => ({
      user_id: userId,
      subject: e.subject,
      course_code: e.course_code || null,
      exam_date: e.exam_date || null,
      confidence_level: 'medium',
      preparation_percent: 0,
      topics: [],
    }));

    const { data, error } = await supabase
      .from('exams')
      .insert(rows)
      .select();

    if (error) throw error;
    res.status(201).json({ imported: data.length, exams: data });
  } catch (err) {
    console.error('Import exams error:', err);
    res.status(500).json({ error: 'Failed to import exams.' });
  }
};

/**
 * POST /api/upload/save-schedule
 * Body: { schedule: { monday: [...], ... } }
 * Stores the parsed weekly schedule on the user's profile.
 */
exports.saveSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;

    if (!schedule || typeof schedule !== 'object') {
      return res.status(400).json({ error: 'Schedule data is required' });
    }

    const { error } = await supabase
      .from('users')
      .update({ weekly_schedule: schedule })
      .eq('id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Save schedule error:', err);
    res.status(500).json({ error: 'Failed to save schedule.' });
  }
};
