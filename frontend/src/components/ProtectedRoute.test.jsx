import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const auth = vi.hoisted(() => ({ current: { user: null, loading: false } }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth.current }));

const { default: ProtectedRoute } = await import('./ProtectedRoute');

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/landing" element={<p>Landing page</p>} />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <p>Private tasks</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects signed-out visitors to the landing page', () => {
    auth.current = { user: null, loading: false };
    renderAt('/tasks');
    expect(screen.getByText('Landing page')).toBeInTheDocument();
    expect(screen.queryByText('Private tasks')).not.toBeInTheDocument();
  });

  it('waits for the session check before deciding', () => {
    auth.current = { user: null, loading: true };
    renderAt('/tasks');
    expect(screen.queryByText('Landing page')).not.toBeInTheDocument();
    expect(screen.queryByText('Private tasks')).not.toBeInTheDocument();
  });

  it('renders the page for a signed-in user', () => {
    auth.current = { user: { id: 'u1' }, loading: false };
    renderAt('/tasks');
    expect(screen.getByText('Private tasks')).toBeInTheDocument();
  });
});
