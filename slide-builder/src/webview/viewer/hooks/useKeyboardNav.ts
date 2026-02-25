import { useEffect, useCallback, type RefObject } from 'react';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import { useVsCodeApi } from './useVsCodeApi';

/**
 * Animation handlers for keyboard navigation integration.
 * v2-2-3: Animation playback control functions.
 */
export interface AnimationHandlers {
  /** Whether current slide has animation groups */
  hasAnimations: boolean;
  /** Current build step (0 = nothing revealed) */
  currentBuildStep: number;
  /** Total number of animation groups */
  totalGroups: number;
  /** Reveal next animation group, returns true if revealed */
  revealNextGroup: () => boolean;
  /** Hide last revealed group, returns true if hidden */
  hideLastGroup: () => boolean;
  /** Reveal all animation groups instantly */
  revealAll: () => void;
  /** Set previous slide to fully built state */
  setFullyBuilt: () => void;
}

/**
 * Hook for keyboard navigation in the V2 viewer.
 * v2-1-3 AC1-6: Implements keyboard shortcuts for slide navigation.
 * v2-2-2 AC1: F key toggles fullscreen mode.
 * v2-2-3 AC3,5,6,7,8: Animation-aware navigation with Space, Arrow, and S keys.
 *
 * Key bindings:
 * - Arrow Right / Space: Next build step OR next slide (wraps to 1 at end)
 * - Arrow Left: Previous build step OR previous slide (wraps to last at beginning)
 * - Home: First slide
 * - End: Last slide
 * - 1-9: Jump to slide N (if valid)
 * - F: Toggle fullscreen mode
 * - S: Skip all animations (reveal all groups)
 * - E: Toggle edit mode (v2-3-1)
 * - Escape: Exit edit mode (v2-3-1)
 * - Alt+↑: Move current slide up one position (v2-4-1)
 * - Alt+↓: Move current slide down one position (v2-4-1)
 *
 * @param containerRef - Ref to the container element for focus management
 * @param animationHandlers - Optional animation control handlers
 */
export function useKeyboardNav(
  containerRef: RefObject<HTMLElement | null>,
  animationHandlers?: AnimationHandlers
): void {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();

  const isFullscreen = state.fullscreenMode !== null;

  // Navigation with animation awareness
  const handleNext = useCallback(() => {
    // v2-2-3 AC-3,6: If in fullscreen and animations exist, reveal next group
    if (isFullscreen && animationHandlers?.hasAnimations) {
      const revealed = animationHandlers.revealNextGroup();
      if (revealed) {
        return; // Revealed a group, don't navigate
      }
      // All groups revealed, fall through to navigate
    }
    dispatch({ type: 'NAVIGATE_NEXT' });
  }, [animationHandlers, isFullscreen, dispatch]);

  const handlePrev = useCallback(() => {
    // v2-2-3 AC-5,7: If in fullscreen and animations exist, hide last group
    if (isFullscreen && animationHandlers?.hasAnimations && animationHandlers.currentBuildStep > 0) {
      const hidden = animationHandlers.hideLastGroup();
      if (hidden) {
        return; // Hid a group, don't navigate
      }
    }
    // Non-fullscreen, at step 0, or no animations - navigate to previous slide
    dispatch({ type: 'NAVIGATE_PREV' });
    // v2-2-3 AC-7: Previous slide should be fully built
    // This is handled by the animation effect in useAnimations detecting slide change
  }, [animationHandlers, isFullscreen, dispatch]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // v3-1-2: In fullscreen edit mode, only handle Escape — let all other keys
      // pass through to contenteditable elements without interference.
      if (state.fullscreenMode === 'edit') {
        if (event.key === 'Escape') {
          event.preventDefault();
          dispatch({ type: 'EXIT_FULLSCREEN' });
        }
        return;
      }

      // AC1.9: Don't capture keys when focus is in input or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Shadow DOM event retargeting: when typing in contenteditable inside shadow DOM,
      // event.target becomes the shadow host, not the actual element. Check if there's
      // an active contenteditable element inside the shadow root.
      const shadowRoot = target.shadowRoot;
      if (shadowRoot) {
        const activeInShadow = shadowRoot.activeElement as HTMLElement | null;
        if (activeInShadow?.isContentEditable) {
          return;
        }
      }

      // Skip if no slides loaded
      if (state.slides.length === 0) return;

      switch (event.key) {
        // AC1, AC2: Arrow Right advances build step or slide
        case 'ArrowRight':
          event.preventDefault();
          handleNext();
          break;

        // AC3: Arrow Left goes back build step or slide
        case 'ArrowLeft':
          event.preventDefault();
          handlePrev();
          break;

        // AC6: Space advances build step or slide
        case ' ':
          event.preventDefault();
          handleNext();
          break;

        // AC5: Home goes to first slide
        case 'Home':
          event.preventDefault();
          dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: 1 });
          break;

        // AC5: End goes to last slide
        case 'End':
          event.preventDefault();
          dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: state.slides.length });
          break;

        // AC4: Number keys 1-9 jump to that slide
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          const slideNum = parseInt(event.key, 10);
          // Only navigate if slide number is valid
          if (slideNum <= state.slides.length) {
            event.preventDefault();
            dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: slideNum });
          }
          break;
        }

        // v3-1-1 AC-1: F key enters fullscreen view mode
        // v3-1-2 AC-6: Shift+F enters fullscreen edit mode
        case 'f':
        case 'F':
          event.preventDefault();
          if (isFullscreen) {
            dispatch({ type: 'EXIT_FULLSCREEN' });
          } else if (event.shiftKey) {
            dispatch({ type: 'ENTER_FULLSCREEN_EDIT' });
          } else {
            dispatch({ type: 'ENTER_FULLSCREEN_VIEW' });
          }
          break;

        // v2-2-3 AC8: S key reveals all animation groups instantly
        case 's':
        case 'S':
          if (animationHandlers?.hasAnimations) {
            event.preventDefault();
            animationHandlers.revealAll();
          }
          break;

        // v2-3-1 AC-3.1.1: E key toggles edit mode
        case 'e':
        case 'E':
          event.preventDefault();
          if (state.mode === 'live-edit') {
            dispatch({ type: 'EXIT_EDIT_MODE' });
          } else if (state.mode === 'presentation') {
            dispatch({ type: 'ENTER_EDIT_MODE' });
          }
          // If animation-builder mode, do nothing (mutually exclusive)
          break;

        // v2-4-2 AC-1,8,9: A key toggles animation builder mode
        case 'a':
        case 'A':
          event.preventDefault();
          if (state.mode === 'animation-builder') {
            dispatch({ type: 'EXIT_BUILDER_MODE' });
          } else if (state.mode === 'presentation') {
            dispatch({ type: 'ENTER_BUILDER_MODE' });
          }
          // If live-edit mode, do nothing (AC-8: modes mutually exclusive)
          break;

        // v3-1-1 AC-2: Escape exits fullscreen view mode
        // v2-3-1 AC-3.1.10, v2-4-2 AC-9: Escape exits edit mode or builder mode
        case 'Escape':
          if (isFullscreen) {
            event.preventDefault();
            dispatch({ type: 'EXIT_FULLSCREEN' });
          } else if (state.mode === 'live-edit') {
            event.preventDefault();
            dispatch({ type: 'EXIT_EDIT_MODE' });
          } else if (state.mode === 'animation-builder') {
            event.preventDefault();
            dispatch({ type: 'EXIT_BUILDER_MODE' });
          }
          break;

        // v2-4-1 AC-7: Alt+ArrowUp moves current slide up one position
        case 'ArrowUp':
          if (event.altKey && state.mode === 'presentation' && !isFullscreen) {
            event.preventDefault();
            // Only move if not already first slide
            if (state.currentSlide > 1) {
              // Build new order: swap current slide with the one above
              const currentOrder = state.slides.map((s) => s.number);
              const currentIdx = state.currentSlide - 1;
              // Swap with slide above
              const temp = currentOrder[currentIdx];
              currentOrder[currentIdx] = currentOrder[currentIdx - 1];
              currentOrder[currentIdx - 1] = temp;
              // Dispatch optimistic update and post to extension
              dispatch({ type: 'REORDER_SLIDES', newOrder: currentOrder });
              postMessage({ type: 'v2-reorder-slides', newOrder: currentOrder });
            }
          }
          break;

        // v2-4-1 AC-7: Alt+ArrowDown moves current slide down one position
        case 'ArrowDown':
          if (event.altKey && state.mode === 'presentation' && !isFullscreen) {
            event.preventDefault();
            // Only move if not already last slide
            if (state.currentSlide < state.slides.length) {
              // Build new order: swap current slide with the one below
              const currentOrder = state.slides.map((s) => s.number);
              const currentIdx = state.currentSlide - 1;
              // Swap with slide below
              const temp = currentOrder[currentIdx];
              currentOrder[currentIdx] = currentOrder[currentIdx + 1];
              currentOrder[currentIdx + 1] = temp;
              // Dispatch optimistic update and post to extension
              dispatch({ type: 'REORDER_SLIDES', newOrder: currentOrder });
              postMessage({ type: 'v2-reorder-slides', newOrder: currentOrder });
            }
          }
          break;

        default:
          // Ignore other keys
          break;
      }
    }

    // Register listener on window to capture all keyboard events
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.slides.length, state.currentSlide, state.mode, state.fullscreenMode, state.slides, dispatch, postMessage, handleNext, handlePrev, animationHandlers, isFullscreen]);
}
