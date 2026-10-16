import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Pages are lazy-loaded, so the first test to open one waits for Vite to
// compile it. The 1s default for findBy*/waitFor is too tight on a cold run.
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (typeof localStorage !== 'undefined') localStorage.clear();
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
