import { describe, expect, it } from 'vitest';
import { readEvents } from './sse';
import { sse, streamOf } from '../test/sse';

async function collect(chunks) {
  const events = [];
  for await (const event of readEvents(streamOf(chunks))) events.push(event);
  return events;
}

describe('readEvents', () => {
  it('parses events delivered in one chunk', async () => {
    const body = sse('delta', { text: 'Hi' }) + sse('done', { reply: 'Hi' });
    expect(await collect([body])).toEqual([
      { event: 'delta', data: { text: 'Hi' } },
      { event: 'done', data: { reply: 'Hi' } },
    ]);
  });

  it('reassembles events split across chunks at any point', async () => {
    const body = sse('delta', { text: 'Start the essay' }) + sse('done', { reply: 'Start the essay' });
    // Split the stream at every possible position.
    for (let i = 1; i < body.length; i += 1) {
      expect(await collect([body.slice(0, i), body.slice(i)])).toHaveLength(2);
    }
  });

  it('handles CRLF line endings, multi-line data and comments', async () => {
    const body = ': keep-alive\r\n\r\nevent: delta\r\ndata: {"text":\r\ndata: "a"}\r\n\r\n';
    expect(await collect([body])).toEqual([{ event: 'delta', data: { text: 'a' } }]);
  });

  it('decodes multi-byte characters split between chunks', async () => {
    const bytes = new TextEncoder().encode(sse('delta', { text: 'café ✓' }));
    // Split between the two bytes of "é".
    const split = bytes.indexOf(0xc3) + 1;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, split));
        controller.enqueue(bytes.slice(split));
        controller.close();
      },
    });
    const events = [];
    for await (const event of readEvents(stream)) events.push(event);
    expect(events).toEqual([{ event: 'delta', data: { text: 'café ✓' } }]);
  });

  it('yields a final event that has no trailing blank line', async () => {
    expect(await collect(['event: done\ndata: {"reply":"ok"}'])).toEqual([
      { event: 'done', data: { reply: 'ok' } },
    ]);
  });

  it('defaults the event name to "message"', async () => {
    expect(await collect(['data: 1\n\n'])).toEqual([{ event: 'message', data: 1 }]);
  });
});
