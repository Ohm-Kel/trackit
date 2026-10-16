/**
 * Read a server-sent event stream from a fetch Response body and yield
 * `{ event, data }` objects, with `data` parsed as JSON.
 *
 * Handles events split across network chunks and CRLF line endings. Only the
 * `event` and `data` fields are used; comments and other fields are ignored.
 *
 * @param {ReadableStream<Uint8Array>} body
 * @returns {AsyncGenerator<{ event: string, data: unknown }>}
 */
export async function* readEvents(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n?/g, '\n');

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const parsed = parseEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (parsed) yield parsed;
      }

      if (done) {
        const last = parseEvent(buffer);
        if (last) yield last;
        return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function parseEvent(block) {
  let event = 'message';
  const data = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  if (data.length === 0) return null;
  return { event, data: JSON.parse(data.join('\n')) };
}
