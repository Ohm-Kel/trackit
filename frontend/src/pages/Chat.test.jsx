import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../hooks/useTasks', () => ({
  useTasks: () => ({ data: [{ id: 't1', title: 'Essay draft', status: 'in_progress', due_date: null }], isLoading: false }),
}));
vi.mock('../hooks/useExams', () => ({ useExams: () => ({ data: [], isLoading: false }) }));
vi.mock('../api/chat', () => ({
  fetchChatHistory: vi.fn(),
  clearChatHistory: vi.fn(),
  streamChatMessage: vi.fn(),
}));

const chatApi = await import('../api/chat');
const { default: Chat } = await import('./Chat');

/** A promise plus its resolve/reject, to control when a reply finishes. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function send(user, text) {
  await user.type(screen.getByPlaceholderText(/ask anything/i), `${text}{Enter}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  chatApi.fetchChatHistory.mockResolvedValue([]);
});

describe('Chat page', () => {
  it('shows saved history and the workload in context', async () => {
    chatApi.fetchChatHistory.mockResolvedValue([
      { role: 'user', content: 'Earlier question', created_at: '2026-10-15T09:00:00Z' },
      { role: 'assistant', content: 'Earlier answer', created_at: '2026-10-15T09:00:05Z' },
    ]);
    render(<Chat />);

    expect(await screen.findByText('Earlier answer')).toBeInTheDocument();
    expect(screen.getByText('Earlier question')).toBeInTheDocument();
    expect(screen.getByText('Essay draft')).toBeInTheDocument();
  });

  it('renders the reply as it streams in, then the final text', async () => {
    const user = userEvent.setup();
    const reply = deferred();
    let onDelta;
    chatApi.streamChatMessage.mockImplementation((message, history, options) => {
      onDelta = options.onDelta;
      return reply.promise;
    });
    render(<Chat />);
    await screen.findByText(/I can see your full schedule/);

    await send(user, 'What first?');
    expect(screen.getByText('What first?')).toBeInTheDocument();
    expect(screen.getByText(/Thinking/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ask anything/i)).toBeDisabled();

    onDelta('Start ');
    expect(await screen.findByText('Start')).toBeInTheDocument();
    expect(screen.queryByText(/Thinking/)).not.toBeInTheDocument();

    onDelta('the essay.');
    expect(await screen.findByText('Start the essay.')).toBeInTheDocument();

    reply.resolve({ reply: 'Start the essay.' });
    await waitFor(() => expect(screen.getByPlaceholderText(/ask anything/i)).toBeEnabled());
    expect(screen.getAllByText('Start the essay.')).toHaveLength(1);

    const [message, history, options] = chatApi.streamChatMessage.mock.calls[0];
    expect(message).toBe('What first?');
    expect(history).toEqual([]);
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });

  it('sends earlier turns as history, but not failed or partial replies', async () => {
    const user = userEvent.setup();
    chatApi.streamChatMessage
      .mockImplementationOnce(async (message, history, { onDelta }) => {
        onDelta('Half an ans');
        throw new Error('The AI service is busy.');
      })
      .mockResolvedValueOnce({ reply: 'Second answer' })
      .mockResolvedValueOnce({ reply: 'Third answer' });
    render(<Chat />);
    await screen.findByText(/I can see your full schedule/);

    await send(user, 'First');
    expect(await screen.findByText(/The AI service is busy/)).toBeInTheDocument();
    expect(screen.getByText('Half an ans')).toBeInTheDocument();

    await send(user, 'Second');
    await screen.findByText('Second answer');
    await send(user, 'Third');
    await screen.findByText('Third answer');

    expect(chatApi.streamChatMessage.mock.calls[1][1]).toEqual([{ role: 'user', content: 'First' }]);
    expect(chatApi.streamChatMessage.mock.calls[2][1]).toEqual([
      { role: 'user', content: 'First' },
      { role: 'user', content: 'Second' },
      { role: 'assistant', content: 'Second answer' },
    ]);
  });

  it('aborts an in-flight reply when the page unmounts', async () => {
    const user = userEvent.setup();
    let signal;
    chatApi.streamChatMessage.mockImplementation((message, history, options) => {
      signal = options.signal;
      return new Promise(() => {});
    });
    const { unmount } = render(<Chat />);
    await screen.findByText(/I can see your full schedule/);

    await send(user, 'q');
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
