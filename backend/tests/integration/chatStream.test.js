const http = require('http');
const ctx = require('../helpers/app');
const { createApp } = require('../../app');

beforeEach(ctx.resetMocks);

/**
 * Fake of the SDK's MessageStream: async-iterable raw events plus
 * finalMessage() and abort(). `failAt` throws `error` before that chunk;
 * `hangAt` waits there until abort() is called.
 */
function fakeStream(chunks, { failAt, error, hangAt } = {}) {
  let rejectHang;
  const stream = {
    abort: jest.fn(() => rejectHang?.(Object.assign(new Error('aborted'), { name: 'AbortError' }))),
    finalMessage: jest.fn(async () => ({ usage: { input_tokens: 300, output_tokens: 12 } })),
    async *[Symbol.asyncIterator]() {
      yield { type: 'message_start' };
      for (let i = 0; i < chunks.length; i += 1) {
        if (i === failAt) throw error;
        if (i === hangAt) await new Promise((_, reject) => (rejectHang = reject));
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: chunks[i] } };
      }
      yield { type: 'message_stop' };
    },
  };
  return stream;
}

/** Parse a server-sent event body into [{ event, data }]. */
function parseEvents(text) {
  return text
    .split('\n\n')
    .filter(Boolean)
    .map((block) => {
      const lines = Object.fromEntries(
        block
          .split('\n')
          .map((line) => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 2)]),
      );
      return { event: lines.event, data: JSON.parse(lines.data) };
    });
}

const post = (body) => ctx.api().post('/api/chat/stream').set(ctx.auth).send(body);

it('streams the reply as deltas, then saves it and sends done', async () => {
  ctx.supabase.queue('tasks', { data: [{ title: 'Essay', status: 'not_started' }] });
  const stream = fakeStream(['Start ', 'the essay', ' today.']);
  ctx.anthropic.messages.stream.mockReturnValue(stream);

  const res = await post({ message: 'What first?' });

  expect(res.status).toBe(200);
  expect(res.headers['content-type']).toMatch(/^text\/event-stream/);
  expect(res.headers['cache-control']).toContain('no-cache');
  expect(parseEvents(res.text)).toEqual([
    { event: 'delta', data: { text: 'Start ' } },
    { event: 'delta', data: { text: 'the essay' } },
    { event: 'delta', data: { text: ' today.' } },
    { event: 'done', data: { reply: 'Start the essay today.' } },
  ]);

  const params = ctx.anthropic.messages.stream.mock.calls[0][0];
  expect(params.system).toContain('"Essay"');
  expect(params.messages).toEqual([{ role: 'user', content: 'What first?' }]);

  const insert = ctx.supabase.queries('chat_history')[0].find(([n]) => n === 'insert')[1];
  expect(insert.map((row) => row.content)).toEqual(['What first?', 'Start the essay today.']);
});

it('returns a JSON error when the model fails before the first token', async () => {
  ctx.anthropic.messages.stream.mockReturnValue(
    fakeStream(['never'], { failAt: 0, error: { status: 529, message: 'overloaded detail' } }),
  );

  const res = await post({ message: 'q' });

  expect(res.status).toBe(503);
  expect(res.headers['content-type']).toMatch(/json/);
  expect(res.body.error).not.toContain('detail');
  expect(ctx.supabase.queries('chat_history')).toEqual([]);
});

it('sends an error event if the model fails mid-reply, and saves nothing', async () => {
  ctx.anthropic.messages.stream.mockReturnValue(
    fakeStream(['Partial', 'never'], { failAt: 1, error: { status: 500, message: 'secret' } }),
  );

  const res = await post({ message: 'q' });

  const events = parseEvents(res.text);
  expect(events[0]).toEqual({ event: 'delta', data: { text: 'Partial' } });
  expect(events[1].event).toBe('error');
  expect(events[1].data.error).toMatch(/AI service/);
  expect(res.text).not.toContain('secret');
  expect(ctx.supabase.queries('chat_history')).toEqual([]);
});

it('validates the body like POST /api/chat', async () => {
  const res = await post({ message: '  ' });
  expect(res.status).toBe(400);
  expect(ctx.anthropic.messages.stream).not.toHaveBeenCalled();
});

it('aborts the model stream when the client disconnects', async () => {
  const stream = fakeStream(['First', 'second'], { hangAt: 1 });
  ctx.anthropic.messages.stream.mockReturnValue(stream);

  const server = createApp().listen(0);
  try {
    await new Promise((resolve, reject) => {
      const req = http.request(
        {
          port: server.address().port,
          path: '/api/chat/stream',
          method: 'POST',
          headers: { ...ctx.auth, 'Content-Type': 'application/json' },
        },
        (res) => {
          // Disconnect as soon as the first delta arrives.
          res.once('data', () => {
            req.destroy();
            resolve();
          });
        },
      );
      req.on('error', () => {});
      req.end(JSON.stringify({ message: 'q' }));
      setTimeout(() => reject(new Error('no data received')), 2000);
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(stream.abort).toHaveBeenCalled();
    expect(ctx.supabase.queries('chat_history')).toEqual([]);
  } finally {
    server.close();
  }
});
