import { useState, useCallback, useEffect, useRef } from 'react';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import { useVsCodeApi } from './useVsCodeApi';

/**
 * Hook for managing fullscreen presentation mode with view/edit differentiation.
 * Uses ViewerContext for fullscreenMode state (shared with useKeyboardNav).
 * Handles native Fullscreen API with CSS-based fallback.
 * Manages control visibility with 3-second timeout.
 * Stores/restores scroll position on enter/exit.
 *
 * v2-2-2 AC-1,2: Toggle fullscreen via F key or button
 * v2-2-2 AC-5: Mouse movement shows controls with fade-in
 * v2-2-2 AC-6: Controls fade out after 3 seconds of no movement
 * v2-2-2 AC-7: Escape exits fullscreen
 * v3-1-1 AC-1,2,4: View mode with scroll position preservation
 * v3-1-2 AC-6,9,10: Edit mode with scroll position preservation
 */

/** Control visibility timeout in milliseconds */
const CONTROL_TIMEOUT_MS = 3000;

export interface UseFullscreenReturn {
  /** Current fullscreen mode: 'view', 'edit', or null (not fullscreen) */
  fullscreenMode: 'view' | 'edit' | null;
  /** Whether fullscreen mode is currently active (derived from fullscreenMode) */
  isFullscreen: boolean;
  /** Whether navigation controls should be visible */
  showControls: boolean;
  /** Enter fullscreen in specified mode */
  enterFullscreen: (mode: 'view' | 'edit') => void;
  /** Exit fullscreen, restoring scroll position */
  exitFullscreen: () => void;
  /** Handle mouse movement (resets control timeout) */
  handleMouseMove: () => void;
}

/**
 * Check if the native Fullscreen API is available.
 */
function isFullscreenApiAvailable(): boolean {
  return typeof document !== 'undefined' && 'fullscreenElement' in document;
}

/**
 * Request fullscreen using native API.
 */
async function requestNativeFullscreen(): Promise<void> {
  if (isFullscreenApiAvailable() && document.documentElement.requestFullscreen) {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen request failed (user denied or not allowed)
      // Fall back to CSS-based fullscreen
    }
  }
}

/**
 * Exit fullscreen using native API.
 */
async function exitNativeFullscreen(): Promise<void> {
  if (isFullscreenApiAvailable() && document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch {
      // Exit fullscreen failed
    }
  }
}

export function useFullscreen(): UseFullscreenReturn {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();
  const fullscreenMode = state.fullscreenMode;
  const isFullscreen = fullscreenMode !== null;

  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollPositionRef = useRef<number>(0);

  /**
   * Clear any existing control timeout.
   */
  const clearControlTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /**
   * Start or reset the control hide timeout.
   */
  const startControlTimeout = useCallback(() => {
    clearControlTimeout();
    timeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, CONTROL_TIMEOUT_MS);
  }, [clearControlTimeout]);

  /**
   * Handle mouse movement - show controls and reset timeout.
   * v2-2-2 AC-5,6
   */
  const handleMouseMove = useCallback(() => {
    if (!isFullscreen) return;
    setShowControls(true);
    startControlTimeout();
  }, [isFullscreen, startControlTimeout]);

  /**
   * Enter fullscreen in specified mode.
   * v3-1-1 AC-1,4: View mode with scroll preservation
   * v3-1-2 AC-6,10: Edit mode with scroll preservation
   */
  const enterFullscreen = useCallback((mode: 'view' | 'edit') => {
    // Store scroll position before entering fullscreen
    scrollPositionRef.current = window.scrollY;

    // Mark as self-initiated so transition effect skips redundant native API call
    selfInitiatedEntryRef.current = true;
    requestNativeFullscreen();
    dispatch({ type: mode === 'view' ? 'ENTER_FULLSCREEN_VIEW' : 'ENTER_FULLSCREEN_EDIT' });
    postMessage({ type: 'v2-enter-fullscreen', mode });
    setShowControls(true);
    startControlTimeout();
  }, [dispatch, postMessage, startControlTimeout]);

  /**
   * Exit fullscreen, restoring scroll position.
   * v3-1-1 AC-2,4: Exit and restore scroll
   */
  const exitFullscreen = useCallback(() => {
    // Mark as self-initiated so transition effect skips redundant cleanup
    selfInitiatedExitRef.current = true;
    exitNativeFullscreen();
    dispatch({ type: 'EXIT_FULLSCREEN' });
    postMessage({ type: 'v2-exit-fullscreen' });
    setShowControls(true);
    clearControlTimeout();

    // Restore scroll position after exiting fullscreen
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  }, [dispatch, postMessage, clearControlTimeout]);

  /**
   * Track fullscreen mode transitions to handle cleanup for all exit paths.
   * When fullscreenMode transitions from non-null to null (any exit path: ESC key,
   * F key, toolbar button, or native browser exit), perform cleanup:
   * - Exit native fullscreen if active
   * - Post exit message to extension host
   * - Restore scroll position
   * v3-1-1 AC-2,4: Ensures ESC key and all exit paths restore state correctly
   */
  const prevFullscreenModeRef = useRef<'view' | 'edit' | null>(fullscreenMode);
  const selfInitiatedExitRef = useRef(false);
  const selfInitiatedEntryRef = useRef(false);

  useEffect(() => {
    const prevMode = prevFullscreenModeRef.current;
    prevFullscreenModeRef.current = fullscreenMode;

    // Detect transition from non-fullscreen to fullscreen (keyboard-triggered entry)
    if (prevMode === null && fullscreenMode !== null) {
      if (selfInitiatedEntryRef.current) {
        // Entry was initiated by enterFullscreen() — native API already called
        selfInitiatedEntryRef.current = false;
        return;
      }
      // Keyboard-triggered entry — call native Fullscreen API
      scrollPositionRef.current = window.scrollY;
      requestNativeFullscreen();
      postMessage({ type: 'v2-enter-fullscreen', mode: fullscreenMode });
      setShowControls(true);
      startControlTimeout();
    }

    // Detect transition from fullscreen to non-fullscreen
    if (prevMode !== null && fullscreenMode === null) {
      if (selfInitiatedExitRef.current) {
        // Exit was initiated by exitFullscreen() — cleanup already done
        selfInitiatedExitRef.current = false;
        return;
      }
      // Keyboard-triggered or external exit — perform cleanup
      exitNativeFullscreen();
      postMessage({ type: 'v2-exit-fullscreen' });
      setShowControls(true);
      clearControlTimeout();

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
      });
    }
  }, [fullscreenMode, postMessage, clearControlTimeout, startControlTimeout]);

  /**
   * Listen for native fullscreen change events.
   * Handles browser's Escape key handling for native Fullscreen API.
   * v2-2-2 AC-7
   */
  useEffect(() => {
    function handleFullscreenChange() {
      const isNowFullscreen = !!document.fullscreenElement;

      if (!isNowFullscreen && isFullscreen) {
        // User exited native fullscreen (via browser UI) — dispatch state change
        // The transition effect above handles cleanup
        dispatch({ type: 'EXIT_FULLSCREEN' });
      }
    }

    if (isFullscreenApiAvailable()) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [isFullscreen, dispatch]);

  /**
   * Cleanup timeout on unmount.
   */
  useEffect(() => {
    return () => {
      clearControlTimeout();
    };
  }, [clearControlTimeout]);

  return {
    fullscreenMode,
    isFullscreen,
    showControls,
    enterFullscreen,
    exitFullscreen,
    handleMouseMove,
  };
}
