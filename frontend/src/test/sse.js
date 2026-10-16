/**
 * Build a ReadableStream that emits the given strings as separate chunks, the
 * way a network response delivers a server-sent event stream.
 * @param {string[]} chunks
 */
export function streamOf(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

/** Format one server-sent event. */
export const sse = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
