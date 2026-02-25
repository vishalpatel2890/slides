import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ViewerProvider, useViewerState, useViewerDispatch } from '../../../../src/webview/viewer/context/ViewerContext';
import { useBuildMode } from '../../../../src/webview/viewer/hooks/useBuildMode';

/**
 * Tests for useBuildMode hook.
 * Story Reference: lv-2-1 AC-12 — useBuildMode.ts handles v2-build-progress messages
 * Story Reference: lv-2-2 AC-23 — useBuildMode.ts handles v2-build-complete messages and exposes dismissBuildBar
 */
describe('useBuildMode hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(ViewerProvider, null, children);

  let messageHandler: ((event: MessageEvent) => void) | null = null;

  beforeEach(() => {
    // Capture the message handler registered by useBuildMode
    vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    messageHandler = null;
    vi.restoreAllMocks();
  });

  // lv-2-1 tests
  describe('v2-build-progress handling (lv-2-1 AC-12)', () => {
    it('dispatches BUILD_PROGRESS on v2-build-progress message', () => {
      const { result } = renderHook(
        () => {
          const { buildMode, dismissBuildBar } = useBuildMode();
          return { state: useViewerState(), dispatch: useViewerDispatch(), buildMode, dismissBuildBar };
        },
        { wrapper }
      );

      expect(messageHandler).not.toBeNull();

      // First start a build so buildMode is active
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'test-build-123',
        });
      });

      // Post v2-build-progress message
      act(() => {
        messageHandler!({
          data: {
            type: 'v2-build-progress',
            currentSlide: 3,
            totalSlides: 5,
            builtCount: 2,
            status: 'building',
          },
        } as MessageEvent);
      });

      expect(result.current.state.buildMode.currentSlide).toBe(3);
      expect(result.current.state.buildMode.builtCount).toBe(2);
      expect(result.current.state.buildMode.totalSlides).toBe(5);
    });

    it('dispatches BUILD_STARTED on v2-build-started message', () => {
      const { result } = renderHook(
        () => {
          const { buildMode } = useBuildMode();
          return { state: useViewerState(), buildMode };
        },
        { wrapper }
      );

      expect(messageHandler).not.toBeNull();

      act(() => {
        messageHandler!({
          data: {
            type: 'v2-build-started',
            mode: 'all',
            totalSlides: 10,
            startSlide: 1,
            buildId: 'test-build-456',
          },
        } as MessageEvent);
      });

      expect(result.current.state.buildMode.active).toBe(true);
      expect(result.current.state.buildMode.mode).toBe('all');
      expect(result.current.state.buildMode.totalSlides).toBe(10);
      expect(result.current.state.buildMode.buildId).toBe('test-build-456');
    });

    it('ignores non-build messages', () => {
      const { result } = renderHook(
        () => {
          useBuildMode();
          return { state: useViewerState() };
        },
        { wrapper }
      );

      // Post a non-build message
      act(() => {
        messageHandler!({
          data: {
            type: 'v2-slide-updated',
            slideNumber: 1,
            html: '<div>test</div>',
          },
        } as MessageEvent);
      });

      // buildMode should still be default (inactive)
      expect(result.current.state.buildMode.active).toBe(false);
    });

    it('ignores messages with no type', () => {
      const { result } = renderHook(
        () => {
          useBuildMode();
          return { state: useViewerState() };
        },
        { wrapper }
      );

      // Post a message with no type
      act(() => {
        messageHandler!({
          data: { foo: 'bar' },
        } as MessageEvent);
      });

      expect(result.current.state.buildMode.active).toBe(false);
    });

    it('ignores null messages', () => {
      const { result } = renderHook(
        () => {
          useBuildMode();
          return { state: useViewerState() };
        },
        { wrapper }
      );

      act(() => {
        messageHandler!({
          data: null,
        } as MessageEvent);
      });

      expect(result.current.state.buildMode.active).toBe(false);
    });
  });

  // lv-2-2 tests
  describe('v2-build-complete handling (lv-2-2 AC-23)', () => {
    it('dispatches BUILD_COMPLETE on v2-build-complete message', () => {
      const { result } = renderHook(
        () => {
          const { buildMode } = useBuildMode();
          return { state: useViewerState(), dispatch: useViewerDispatch(), buildMode };
        },
        { wrapper }
      );

      // Start a build first
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 12,
          startSlide: 1,
          buildId: 'complete-hook-test',
        });
      });

      // Post v2-build-complete message
      act(() => {
        messageHandler!({
          data: {
            type: 'v2-build-complete',
            builtCount: 12,
            errorCount: 0,
            cancelled: false,
          },
        } as MessageEvent);
      });

      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.status).toBe('complete');
      expect(result.current.state.buildMode.builtCount).toBe(12);
      expect(result.current.state.buildMode.completedAt).toBeTypeOf('number');
    });

    it('dispatches BUILD_COMPLETE with cancelled flag', () => {
      const { result } = renderHook(
        () => {
          const { buildMode } = useBuildMode();
          return { state: useViewerState(), dispatch: useViewerDispatch(), buildMode };
        },
        { wrapper }
      );

      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 10,
          startSlide: 1,
          buildId: 'cancel-hook-test',
        });
      });

      act(() => {
        messageHandler!({
          data: {
            type: 'v2-build-complete',
            builtCount: 5,
            errorCount: 0,
            cancelled: true,
          },
        } as MessageEvent);
      });

      expect(result.current.state.buildMode.status).toBe('cancelled');
    });
  });

  describe('dismissBuildBar callback (lv-2-2 AC-23)', () => {
    it('dispatches BUILD_DISMISSED when called', () => {
      const { result } = renderHook(
        () => {
          const { buildMode, dismissBuildBar } = useBuildMode();
          return { state: useViewerState(), dispatch: useViewerDispatch(), buildMode, dismissBuildBar };
        },
        { wrapper }
      );

      // Start and complete a build
      act(() => {
        result.current.dispatch({
          type: 'BUILD_STARTED',
          mode: 'all',
          totalSlides: 5,
          startSlide: 1,
          buildId: 'dismiss-hook-test',
        });
      });
      act(() => {
        result.current.dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: 5,
          errorCount: 0,
          cancelled: false,
        });
      });

      expect(result.current.state.buildMode.status).toBe('complete');

      // Call dismissBuildBar
      act(() => {
        result.current.dismissBuildBar();
      });

      expect(result.current.state.buildMode.status).toBe('idle');
      expect(result.current.state.buildMode.active).toBe(false);
      expect(result.current.state.buildMode.completedAt).toBe(null);
    });

    it('returns buildMode state from hook', () => {
      const { result } = renderHook(
        () => {
          const { buildMode, dismissBuildBar } = useBuildMode();
          return { buildMode, dismissBuildBar };
        },
        { wrapper }
      );

      expect(result.current.buildMode).toBeDefined();
      expect(result.current.buildMode.status).toBe('idle');
      expect(result.current.buildMode.active).toBe(false);
      expect(typeof result.current.dismissBuildBar).toBe('function');
    });
  });
});
