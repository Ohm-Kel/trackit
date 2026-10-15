const { parseTimetable, normalizeToolInput, TOOLS, DAYS } = require('../../lib/timetableParser');

function fakeClient(toolInput, toolName = TOOLS.exam.name) {
  return {
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'tool_use', name: toolName, input: toolInput }],
        usage: { input_tokens: 1200, output_tokens: 150 },
      }),
    },
  };
}

describe('tool definitions', () => {
  it('generate JSON Schemas without the $schema key', () => {
    for (const tool of Object.values(TOOLS)) {
      expect(tool.input_schema.type).toBe('object');
      expect(tool.input_schema).not.toHaveProperty('$schema');
    }
  });

  it('require every weekday in the schedule schema', () => {
    expect(TOOLS.schedule.input_schema.required).toEqual(DAYS);
  });
});

describe('normalizeToolInput', () => {
  it('keeps valid exams and counts invalid ones', () => {
    const { data, dropped } = normalizeToolInput('exam', {
      exams: [
        {
          subject: 'Calculus',
          course_code: 'MATH 201',
          exam_date: '2026-12-10',
          exam_time: '9:00',
          venue: null,
        },
        { subject: '', course_code: null, exam_date: null, exam_time: null, venue: null },
        {
          subject: 'Physics',
          course_code: null,
          exam_date: '10/12/2026',
          exam_time: null,
          venue: null,
        },
      ],
    });
    expect(data).toHaveLength(1);
    expect(data[0].subject).toBe('Calculus');
    expect(dropped).toBe(2);
  });

  it('returns an empty list for missing or malformed input', () => {
    expect(normalizeToolInput('exam', undefined)).toEqual({ data: [], dropped: 0 });
    expect(normalizeToolInput('exam', { exams: 'nope' })).toEqual({ data: [], dropped: 0 });
  });

  it('fills every day, sorts sessions by start time and drops bad times', () => {
    const { data, dropped } = normalizeToolInput('schedule', {
      monday: [
        { start: '14:00', end: '16:00', subject: 'Databases', venue: 'B12' },
        { start: '08:00', end: '10:00', subject: 'Algorithms', venue: null },
        { start: '8am', end: '10am', subject: 'Bad', venue: null },
      ],
    });
    expect(Object.keys(data)).toEqual(DAYS);
    expect(data.monday.map((s) => s.subject)).toEqual(['Algorithms', 'Databases']);
    expect(data.sunday).toEqual([]);
    expect(dropped).toBe(1);
  });
});

describe('parseTimetable', () => {
  it('forces the matching tool and sends PDFs as document blocks', async () => {
    const client = fakeClient({ exams: [] });
    await parseTimetable({
      client,
      model: 'm',
      fileBase64: 'QUJD',
      mimeType: 'application/pdf',
      type: 'exam',
    });

    const request = client.messages.create.mock.calls[0][0];
    expect(request.tool_choice).toEqual({ type: 'tool', name: 'record_exams' });
    expect(request.temperature).toBe(0);
    expect(request.messages[0].content[0].type).toBe('document');
  });

  it('sends images as image blocks and normalises image/jpg', async () => {
    const client = fakeClient(Object.fromEntries(DAYS.map((d) => [d, []])), TOOLS.schedule.name);
    const result = await parseTimetable({
      client,
      model: 'm',
      fileBase64: 'QUJD',
      mimeType: 'image/jpg',
      type: 'schedule',
    });

    const block = client.messages.create.mock.calls[0][0].messages[0].content[0];
    expect(block.type).toBe('image');
    expect(block.source.media_type).toBe('image/jpeg');
    expect(result.usage.input_tokens).toBe(1200);
  });

  it('returns no exams when the model calls no tool', async () => {
    const client = {
      messages: {
        create: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'hi' }] }),
      },
    };
    const result = await parseTimetable({
      client,
      model: 'm',
      fileBase64: 'QUJD',
      mimeType: 'image/png',
      type: 'exam',
    });
    expect(result.data).toEqual([]);
  });

  it('rejects unsupported media types before calling the API', async () => {
    const client = fakeClient({ exams: [] });
    await expect(
      parseTimetable({
        client,
        model: 'm',
        fileBase64: 'QUJD',
        mimeType: 'text/plain',
        type: 'exam',
      }),
    ).rejects.toThrow('Unsupported media type');
    expect(client.messages.create).not.toHaveBeenCalled();
  });
});
