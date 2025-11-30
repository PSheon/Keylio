import '@testing-library/jest-dom';
import * as nodeCrypto from 'crypto';

// Only run browser mocks when in jsdom environment (not in node)
if (typeof window !== 'undefined') {
  // Mock window.crypto for jsdom environment if needed
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => nodeCrypto.randomFillSync(arr),
        subtle: nodeCrypto.webcrypto.subtle,
        randomUUID: () => nodeCrypto.randomUUID(),
      },
    });
  }

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Mock ResizeObserver
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverMock;

  // Mock IntersectionObserver
  class IntersectionObserverMock {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}
