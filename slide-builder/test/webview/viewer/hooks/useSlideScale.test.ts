/**
 * Tests for useSlideScale hook.
 * cv-bugfix-sidebar-thumbnails AC1-4,6: Scale readiness and resize responsiveness
 * cv-bugfix-thumbnail-rendering AC-2: rAF-wrapped scale recalculation on sidebar toggle
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSlideScale } from '../../../../src/webview/viewer/hooks/useSlideScale';

// Store ResizeObserver callbacks for manual triggering
let resizeCallbacks: ResizeObserverCallback[] = [];

class ControllableResizeObserver implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeCallbacks.push(callback);
  }

  observe(_target: Element): void {
    // Don't auto-fire — tests will trigger manually
  }

  unobserve(_target: Element): void {}

  disconnect(): void {
    resizeCallbacks = resizeCallbacks.filter((cb) => cb !== this.callback);
  }
}

describe('useSlideScale', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver;

  // cv-bugfix-thumbnail-rendering: rAF is now used in ResizeObserver callbacks.
  // Default: mock rAF to execute synchronously so existing tests still work.
  let rafSyncSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resizeCallbacks = [];
    globalThis.ResizeObserver = ControllableResizeObserver as unknown as typeof ResizeObserver;
    // Default: rAF executes callback synchronously
    rafSyncSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    rafSyncSpy.mockRestore();
    globalThis.ResizeObserver = OriginalResizeObserver;
  });

  function createMockContainer(width: number, height: number) {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: width, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: height, configurable: true });
    return el;
  }

  it('returns ready=false initially when container has 0 dimensions', () => {
    const container = createMockContainer(0, 0);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(false);
    expect(result.current.scale).toBe(1);
  });

  it('returns ready=true when container has valid dimensions', () => {
    const container = createMockContainer(192, 108);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(true);
    expect(result.current.scale).toBe(0.1);
  });

  it('calculates correct scale for non-uniform container', () => {
    // Container wider than 16:9 — height is the constraint
    const container = createMockContainer(400, 108);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(true);
    expect(result.current.scale).toBe(0.1); // min(400/1920, 108/1080) = min(0.208, 0.1)
  });

  it('updates scale when ResizeObserver fires with new dimensions', () => {
    const container = createMockContainer(192, 108);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.scale).toBe(0.1);

    // Simulate container resize
    Object.defineProperty(container, 'clientWidth', { value: 384, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 216, configurable: true });

    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    expect(result.current.scale).toBe(0.2);
    expect(result.current.ready).toBe(true);
  });

  it('sets ready=false when container transitions to 0 dimensions (collapse)', () => {
    const container = createMockContainer(192, 108);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(true);

    // Simulate sidebar collapse (0 width)
    Object.defineProperty(container, 'clientWidth', { value: 0, configurable: true });

    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    expect(result.current.ready).toBe(false);
  });

  it('recovers ready=true when container re-expands from collapsed state', () => {
    const container = createMockContainer(0, 0);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(false);

    // Simulate expansion
    Object.defineProperty(container, 'clientWidth', { value: 192, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 108, configurable: true });

    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.scale).toBe(0.1);
  });

  it('handles null containerRef gracefully', () => {
    const ref = { current: null };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(false);
    expect(result.current.scale).toBe(1);
  });

  it('disconnects ResizeObserver on unmount', () => {
    const container = createMockContainer(192, 108);
    const ref = { current: container };

    const { unmount } = renderHook(() => useSlideScale(ref));

    expect(resizeCallbacks.length).toBe(1);

    unmount();

    expect(resizeCallbacks.length).toBe(0);
  });

  // cv-bugfix-thumbnail-rendering AC-2: rAF-wrapped recalculation tests

  it('uses requestAnimationFrame for ResizeObserver callbacks', () => {
    // rafSyncSpy from beforeEach already tracks calls
    const container = createMockContainer(192, 108);
    const ref = { current: container };

    renderHook(() => useSlideScale(ref));

    // Clear call count from initial render
    rafSyncSpy.mockClear();

    // Simulate a resize event
    Object.defineProperty(container, 'clientWidth', { value: 384, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 216, configurable: true });

    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    // rAF should have been called by the ResizeObserver handler
    expect(rafSyncSpy).toHaveBeenCalled();
  });

  it('cancels pending rAF on rapid ResizeObserver callbacks', () => {
    const container = createMockContainer(192, 108);
    const ref = { current: container };
    const cancelRafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    // Override the default sync rAF to NOT execute immediately (simulate async rAF)
    rafSyncSpy.mockRestore();
    rafSyncSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((_cb) => {
      return 42;
    });

    renderHook(() => useSlideScale(ref));

    // First resize — schedules rAF
    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    // Second resize before rAF fires — should cancel previous
    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    expect(cancelRafSpy).toHaveBeenCalledWith(42);

    cancelRafSpy.mockRestore();
  });

  it('cancels pending rAF on unmount', () => {
    const container = createMockContainer(192, 108);
    const ref = { current: container };
    const cancelRafSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    // Override the default sync rAF to NOT execute immediately (simulate async rAF)
    rafSyncSpy.mockRestore();
    rafSyncSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((_cb) => {
      return 99;
    });

    const { unmount } = renderHook(() => useSlideScale(ref));

    // Trigger a resize to schedule an rAF
    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    unmount();

    // Should cancel the pending rAF
    expect(cancelRafSpy).toHaveBeenCalledWith(99);

    cancelRafSpy.mockRestore();
  });

  it('correctly recalculates after 0-to-nonzero transition via rAF (AC-2)', () => {
    // rafSyncSpy from beforeEach executes rAF synchronously — exactly what we need
    const container = createMockContainer(0, 0);
    const ref = { current: container };

    const { result } = renderHook(() => useSlideScale(ref));

    expect(result.current.ready).toBe(false);

    // Simulate sidebar expand: dimensions go from 0 to valid
    Object.defineProperty(container, 'clientWidth', { value: 192, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 108, configurable: true });

    act(() => {
      resizeCallbacks.forEach((cb) =>
        cb([] as unknown as ResizeObserverEntry[], {} as ResizeObserver)
      );
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.scale).toBe(0.1);
  });
});
