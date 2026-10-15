import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

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
