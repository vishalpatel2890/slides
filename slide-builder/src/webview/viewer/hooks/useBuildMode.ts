import { useEffect, useCallback } from 'react';
import { useViewerDispatch, useViewerState } from '../context/ViewerContext';
import type { BuildModeState } from '../context/ViewerContext';

/**
 * Hook that listens for v2-build-started, v2-build-progress, and v2-build-complete
 * messages from the extension host and dispatches corresponding actions to ViewerContext.
 * Also exposes dismissBuildBar callback for user-initiated dismissal.
 *
 * Story Reference: lv-1-1 AC-10 — useBuildMode.ts hook listens for v2-build-started
 * Story Reference: lv-2-1 AC-12 — Handles v2-build-progress messages
 * Story Reference: lv-2-2 AC-23 — Handles v2-build-complete messages and exposes dismissBuildBar
 * Architecture Reference: Pattern 8 — useBuildMode hook via window.addEventListener('message')
 */
export function useBuildMode(): { buildMode: BuildModeState; dismissBuildBar: () => void } {
  const dispatch = useViewerDispatch();
  const state = useViewerState();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data;
      if (!message || typeof message.type !== 'string') return;

      if (message.type === 'v2-build-started') {
        dispatch({
          type: 'BUILD_STARTED',
          mode: message.mode,
          totalSlides: message.totalSlides,
          startSlide: message.startSlide,
          buildId: message.buildId,
        });
      }

      // lv-2-1 AC-12: Handle v2-build-progress messages
      if (message.type === 'v2-build-progress') {
        dispatch({
          type: 'BUILD_PROGRESS',
          currentSlide: message.currentSlide,
          totalSlides: message.totalSlides,
          builtCount: message.builtCount,
          status: message.status,
        });
      }

      // lv-2-2 AC-23: Handle v2-build-complete messages
      if (message.type === 'v2-build-complete') {
        dispatch({
          type: 'BUILD_COMPLETE',
          builtCount: message.builtCount,
          errorCount: message.errorCount,
          cancelled: message.cancelled,
        });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);

  // lv-2-2 AC-23: Expose dismissBuildBar callback that dispatches BUILD_DISMISSED
  const dismissBuildBar = useCallback(() => {
    dispatch({ type: 'BUILD_DISMISSED' });
  }, [dispatch]);

  return { buildMode: state.buildMode, dismissBuildBar };
}
