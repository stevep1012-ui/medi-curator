// Vitest 전역 셋업 — jsdom + MSW 서버 부팅 + jest-dom matchers
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { ReadableStream, TransformStream, WritableStream } from 'node:stream/web';

Object.assign(globalThis, {
  ReadableStream,
  TransformStream,
  WritableStream,
});

const { server } = await import('./msw/server');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// jsdom 보강 — matchMedia 만. clipboard는 user-event가 자체 stub 제공.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
