import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { onlineManager } from '@tanstack/react-query';

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  onlineManager.setOnline(true);
  if (typeof localStorage !== 'undefined') localStorage.clear();
  if (typeof window !== 'undefined') {
    // Saved React Query caches must not leak from one test into the next.
    const { clearPersistedQueries } = await import('../lib/queryPersistence');
    await clearPersistedQueries();
  }
});

// Browser APIs jsdom lacks. (Absent entirely in node-environment tests.)
if (typeof window !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
  window.matchMedia ??= (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  });
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
