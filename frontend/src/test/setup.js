import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

// jsdom does not implement scrolling. (Absent in node-environment tests.)
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView = () => {};
