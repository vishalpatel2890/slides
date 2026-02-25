/**
 * Tests for useFullscreen hook.
 * v2-2-2 AC1-7: Fullscreen presentation mode with control visibility
 * v3-1-1: Updated to use fullscreenMode ('view' | 'edit' | null) instead of isFullscreen boolean
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFullscreen } from '../../../../src/webview/viewer/hooks/useFullscreen';

// Mock ViewerContext
const mockDispatch = vi.fn();
let mockFullscreenMode: 'view' | 'edit' | null = null;

// Mock postMessage
const mockPostMessage = vi.fn();

vi.mock('../../../../src/webview/viewer/context/ViewerContext', () => ({
  useViewerState: () => ({
    fullscreenMode: mockFullscreenMode,
    slides: [],
    currentSlide: 1,
    isLoading: false,
    error: null,
    deckId: null,
    deckName: null,
    sidebarVisible: true,
    currentBuildStep: 0,
  }),
  useViewerDispatch: () => mockDispatch,
}));

vi.mock('../../../../src/webview/viewer/hooks/useVsCodeApi', () => ({
  useVsCodeApi: () => ({
    postMessage: mockPostMessage,
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

describe('useFullscreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockFullscreenMode = null;
    // Mock Fullscreen API
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with fullscreenMode=null and isFullscreen=false', () => {
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.fullscreenMode).toBeNull();
      expect(result.current.isFullscreen).toBe(false);
    });

    it('starts with showControls=true', () => {
      const { result } = renderHook(() => useFullscreen());
      expect(result.current.showControls).toBe(true);
    });

    it('provides enterFullscreen function', () => {
      const { result } = renderHook(() => useFullscreen());
      expect(typeof result.current.enterFullscreen).toBe('function');
    });

    it('provides exitFullscreen function', () => {
      const { result } = renderHook(() => useFullscreen());
      expect(typeof result.current.exitFullscreen).toBe('function');
    });

    it('provides handleMouseMove function', () => {
      const { result } = renderHook(() => useFullscreen());
      expect(typeof result.current.handleMouseMove).toBe('function');
    });
  });

  describe('enterFullscreen (v3-1-1 AC-1)', () => {
    it('dispatches ENTER_FULLSCREEN_VIEW when entering view mode', () => {
      const { result } = renderHook(() => useFullscreen());

      act(() => {
        result.current.enterFullscreen('view');
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ENTER_FULLSCREEN_VIEW' });
    });

    it('dispatches ENTER_FULLSCREEN_EDIT when entering edit mode', () => {
      const { result } = renderHook(() => useFullscreen());

      act(() => {
        result.current.enterFullscreen('edit');
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ENTER_FULLSCREEN_EDIT' });
    });

    it('posts v2-enter-fullscreen message with mode', () => {
      const { result } = renderHook(() => useFullscreen());

      act(() => {
        result.current.enterFullscreen('view');
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'v2-enter-fullscreen', mode: 'view' });
    });

    it('shows controls when entering fullscreen', () => {
      const { result } = renderHook(() => useFullscreen());

      act(() => {
        result.current.enterFullscreen('view');
      });

      expect(result.current.showControls).toBe(true);
    });
  });

  describe('exitFullscreen (v3-1-1 AC-2)', () => {
    it('dispatches EXIT_FULLSCREEN', () => {
      mockFullscreenMode = 'view';
      const { result } = renderHook(() => useFullscreen());

      act(() => {
        result.current.exitFullscreen();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'EXIT_FULLSCREEN' });
    });

    it('posts v2-exit-fullscreen message', () => {
      mockFullscreenMode = 'view';
      const { result } = renderHook(() => useFullscreen());

      act(() => {
        result.current.exitFullscreen();
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'v2-exit-fullscreen' });
    });

    it('restores showControls=true when exiting', () => {
      mockFullscreenMode = 'view';
      const { result } = renderHook(() => useFullscreen());

      // Trigger mouse move then wait for controls to hide
      act(() => {
        result.current.handleMouseMove();
      });
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.showControls).toBe(false);

      // Exit fullscreen
      act(() => {
        result.current.exitFullscreen();
      });

      expect(result.current.showControls).toBe(true);
    });
  });

  describe('mouse movement and control timeout (AC-5,6)', () => {
    it('keeps showControls=true on mouse move in fullscreen', () => {
      mockFullscreenMode = 'view';
      const { result } = renderHook(() => useFullscreen());

      // Move mouse
      act(() => {
        result.current.handleMouseMove();
      });

      expect(result.current.showControls).toBe(true);
    });

    it('sets showControls=false after 3 seconds of no movement', () => {
      mockFullscreenMode = 'view';
      const { result } = renderHook(() => useFullscreen());

      // Trigger mouse move to start timeout
      act(() => {
        result.current.handleMouseMove();
      });

      // Wait 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.showControls).toBe(false);
    });

    it('resets timeout on mouse movement', () => {
      mockFullscreenMode = 'view';
      const { result } = renderHook(() => useFullscreen());

      // Trigger initial mouse move
      act(() => {
        result.current.handleMouseMove();
      });

      // Wait 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Move mouse (resets timer)
      act(() => {
        result.current.handleMouseMove();
      });

      // Wait another 2 seconds (total 4s, but timer was reset)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Controls should still be visible (only 2s since last movement)
      expect(result.current.showControls).toBe(true);

      // Wait 1 more second (3s since movement)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.showControls).toBe(false);
    });

    it('does not start timeout when not in fullscreen', () => {
      mockFullscreenMode = null;
      const { result } = renderHook(() => useFullscreen());

      // Move mouse while not fullscreen
      act(() => {
        result.current.handleMouseMove();
      });

      // Wait 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // showControls should still be true (no timeout in normal mode)
      expect(result.current.showControls).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      mockFullscreenMode = 'view';

      const { result, unmount } = renderHook(() => useFullscreen());

      // Start a timeout by moving mouse
      act(() => {
        result.current.handleMouseMove();
      });

      unmount();

      // clearTimeout should have been called during cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
