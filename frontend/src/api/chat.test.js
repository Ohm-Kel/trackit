import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sse, streamOf } from '../test/sse';

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: 'jwt-123' } } })),
    },
  },
}));

const { streamChatMessage } = await import('./chat');

function respond(chunks, init = {}) {
  return new Response(streamOf(chunks), {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
    ...init,
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe('streamChatMessage', () => {
  it('posts the message with the user’s token and reports each fragment', async () => {
    fetch.mockResolvedValue(
      respond([sse('delta', { text: 'Start ' }), sse('delta', { text: 'now.' }), sse('done', { reply: 'Start now.' })]),
    );
    const onDelta = vi.fn();
    const history = [{ role: 'user', content: 'hi' }];

    await expect(streamChatMessage('What first?', history, { onDelta })).resolves.toEqual({
      reply: 'Start now.',
    });

    expect(onDelta.mock.calls).toEqual([['Start '], ['now.']]);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/chat\/stream$/);
    expect(init.headers.Authorization).toBe('Bearer jwt-123');
    expect(JSON.parse(init.body)).toEqual({ message: 'What first?', history });
  });

  it('throws the API’s message for JSON error responses', async () => {
    fetch.mockResolvedValue(
      new Response(JSON.stringify({ error: 'AI request limit reached.' }), { status: 429 }),
    );
    await expect(streamChatMessage('q')).rejects.toThrow('AI request limit reached.');
  });

  it('throws when the server reports a failure mid-reply', async () => {
    fetch.mockResolvedValue(
      respond([sse('delta', { text: 'Part' }), sse('error', { error: 'The AI service is busy.' })]),
    );
    const onDelta = vi.fn();
    await expect(streamChatMessage('q', [], { onDelta })).rejects.toThrow('The AI service is busy.');
    expect(onDelta).toHaveBeenCalledWith('Part');
  });

  it('throws if the stream ends without a done event', async () => {
    fetch.mockResolvedValue(respond([sse('delta', { text: 'Part' })]));
    await expect(streamChatMessage('q')).rejects.toThrow(/interrupted/);
  });

  it('passes the abort signal to fetch', async () => {
    fetch.mockResolvedValue(respond([sse('done', { reply: 'ok' })]));
    const controller = new AbortController();
    await streamChatMessage('q', [], { signal: controller.signal });
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });
});
