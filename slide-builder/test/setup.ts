import '@testing-library/jest-dom/vitest';

// Re-export the vscode mock for tests that need direct access
export * as vscode from './__mocks__/vscode';

// Mock IntersectionObserver for jsdom environment (used by ThumbnailCard lazy loading)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }

  observe(target: Element): void {
    // Schedule callback after React's render cycle completes
    queueMicrotask(() => {
      this.callback(
        [
          {
            isIntersecting: true,
            target,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRatio: 1,
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
          },
        ],
        this
      );
    });
  }

  unobserve(_target: Element): void {
    // No-op
  }

  disconnect(): void {
    // No-op
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver for jsdom environment (used by useSlideScale hook)
class MockResizeObserver implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    // Schedule callback after React's render cycle completes
    queueMicrotask(() => {
      this.callback(
        [
          {
            target,
            contentRect: target.getBoundingClientRect(),
            borderBoxSize: [{ inlineSize: 800, blockSize: 450 }],
            contentBoxSize: [{ inlineSize: 800, blockSize: 450 }],
            devicePixelContentBoxSize: [{ inlineSize: 800, blockSize: 450 }],
          } as unknown as ResizeObserverEntry,
        ],
        this
      );
    });
  }

  unobserve(_target: Element): void {
    // No-op
  }

  disconnect(): void {
    // No-op
  }
}

globalThis.ResizeObserver = MockResizeObserver;
