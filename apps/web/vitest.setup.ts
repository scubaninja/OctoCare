import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// React Testing Library recommends unmounting components between tests to
// avoid leaking DOM nodes/state across test cases. RTL auto-registers this
// for Jest, so we wire it up explicitly for Vitest here.
afterEach(() => {
  cleanup();
});
