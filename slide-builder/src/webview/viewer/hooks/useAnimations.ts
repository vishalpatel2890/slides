import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import type { ViewerV2DeckContent } from '../../../shared/types';
import { assignStableBuildIds } from '../utils/buildId';

/**
 * Animation playback state for a slide.
 * v2-2-3: Manages build animation groups and step-by-step reveal.
 */
export interface AnimationState {
  currentBuildStep: number;  // 0 = nothing revealed
  totalGroups: number;       // Total animation groups on current slide
  hasAnimations: boolean;    // Whether current slide has animation groups
}

/**
 * CSS selector matching the AnimationBuilder's SELECTABLE_ELEMENT_SELECTOR.
 * Must stay in sync with AnimationBuilder.tsx so that data-build-id assignment
 * produces the same IDs during playback as during builder mode.
 */
const SELECTABLE_ELEMENT_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, img, figure, blockquote, table, pre, code, svg, .icon, [class*="icon"], [class*="box"], [class*="card"], [data-animate], [data-build-id]';

/**
 * Assign stable content-based build IDs to elements in the shadow DOM.
 * Uses the shared utility to ensure IDs match what AnimationBuilder generates.
 *
 * Must be called before any animation hide/show operations since
 * shadowRoot.innerHTML resets destroy runtime-assigned attributes.
 */
function assignBuildIds(container: ShadowRoot | HTMLElement): void {
  assignStableBuildIds(container, SELECTABLE_ELEMENT_SELECTOR);
}

/**
 * Convert manifest animation groups to CSS selector arrays.
 * Handles both new format (animations.groups with elementIds) and legacy format (buildGroups).
 * @param slideManifest - The slide manifest entry
 * @returns Array of CSS selector arrays for each animation group, sorted by order
 */
function getAnimationSelectors(slideManifest: ViewerV2DeckContent['manifest']['slides'][0] | undefined): string[][] {
  if (!slideManifest) return [];

  // New format: animations.groups with elementIds
  if (slideManifest.animations?.groups && slideManifest.animations.groups.length > 0) {
    // Sort by order and convert elementIds to CSS ID selectors
    return slideManifest.animations.groups
      .slice() // Don't mutate original
      .sort((a, b) => a.order - b.order)
      .map(group => group.elementIds.map(id => `[data-build-id="${id}"]`));
  }

  // Legacy format: buildGroups as string[][] of CSS selectors
  if (slideManifest.buildGroups && slideManifest.buildGroups.length > 0) {
    return slideManifest.buildGroups;
  }

  return [];
}

/**
 * Hook for managing animation playback state.
 * v2-2-3 AC1-11: Build animation playback with step-by-step reveal.
 *
 * @param manifest - The deck manifest containing animation group definitions
 * @returns Animation state and control functions
 */
export function useAnimations(manifest: ViewerV2DeckContent['manifest'] | null) {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  // Store reference to the ShadowRoot for DOM queries (not the host element)
  const slideContainerRef = useRef<ShadowRoot | null>(null);

  // Get animation groups for current slide from manifest
  const currentSlideManifest = manifest?.slides.find(
    (s) => s.number === state.currentSlide
  );

  // Debug: Log manifest data to help diagnose animation issues
  useEffect(() => {
    console.log('[useAnimations] Debug info:', {
      hasManifest: !!manifest,
      manifestSlideCount: manifest?.slides?.length ?? 0,
      currentSlide: state.currentSlide,
      currentSlideManifest: currentSlideManifest ? {
        number: currentSlideManifest.number,
        hasAnimations: !!currentSlideManifest.animations,
        animationGroupCount: currentSlideManifest.animations?.groups?.length ?? 0,
        hasBuildGroups: !!currentSlideManifest.buildGroups,
        buildGroupsCount: currentSlideManifest.buildGroups?.length ?? 0,
      } : null,
    });
  }, [manifest, state.currentSlide, currentSlideManifest]);

  // Convert manifest animation format to CSS selector arrays (memoized for stability)
  const buildGroups = useMemo(
    () => getAnimationSelectors(currentSlideManifest),
    [currentSlideManifest]
  );
  const totalGroups = buildGroups.length;
  const hasAnimations = totalGroups > 0;

  // Debug: Log computed animation state
  useEffect(() => {
    if (hasAnimations) {
      console.log('[useAnimations] Animation state:', {
        totalGroups,
        buildGroups,
        currentBuildStep: state.currentBuildStep,
      });
    }
  }, [hasAnimations, totalGroups, buildGroups, state.currentBuildStep]);

  // Current build step from context
  const currentBuildStep = state.currentBuildStep;

  /**
   * Find the slide container's shadowRoot for DOM manipulation.
   * Returns the ShadowRoot where slide content lives (for CSS isolation).
   * Validates cached reference is still in document (handles fullscreen toggle remounts).
   */
  const getSlideContainer = useCallback((): ShadowRoot | null => {
    // Check if cached ref's host is still in the document (may be stale after fullscreen toggle)
    if (slideContainerRef.current && document.contains(slideContainerRef.current.host)) {
      return slideContainerRef.current;
    }
    // Find the slide content container host element and access its shadowRoot
    const container = document.querySelector('.slide-display__container');
    if (container instanceof HTMLElement && container.shadowRoot) {
      slideContainerRef.current = container.shadowRoot;
      return container.shadowRoot;
    }
    slideContainerRef.current = null;
    return null;
  }, []);

  /**
   * Apply animation-hidden class to elements in a build group.
   * Works with both ShadowRoot (for CSS-isolated slides) and HTMLElement.
   */
  const hideGroup = useCallback((groupSelectors: string[], container: ShadowRoot | HTMLElement) => {
    groupSelectors.forEach((selector) => {
      try {
        const elements = container.querySelectorAll(selector);
        console.log(`[useAnimations] hideGroup: selector="${selector}" found ${elements.length} elements`);
        elements.forEach((el) => {
          el.classList.remove('animation-visible');
          el.classList.add('animation-hidden');
        });
      } catch (e) {
        console.log(`[useAnimations] hideGroup: selector="${selector}" error:`, e);
      }
    });
  }, []);

  /**
   * Apply animation-visible class to elements in a build group.
   * Works with both ShadowRoot (for CSS-isolated slides) and HTMLElement.
   */
  const showGroup = useCallback((groupSelectors: string[], container: ShadowRoot | HTMLElement, instant = false) => {
    groupSelectors.forEach((selector) => {
      try {
        const elements = container.querySelectorAll(selector);
        console.log(`[useAnimations] showGroup: selector="${selector}" found ${elements.length} elements, instant=${instant}`);
        elements.forEach((el) => {
          el.classList.remove('animation-hidden');
          el.classList.add('animation-visible');
          if (instant) {
            // Skip transition for instant reveal (S key or reduced motion)
            el.classList.add('animation-instant');
            // Remove instant class after next frame to allow future transitions
            requestAnimationFrame(() => {
              el.classList.remove('animation-instant');
            });
          }
        });
      } catch {
        // Invalid selector - skip silently
      }
    });
  }, []);

  /**
   * Initialize animation state when slide changes or fullscreen toggles.
   * AC-1: Hide all animation group elements on slide load.
   * AC-7: Show all groups instantly if navigated backward (previous slide fully built).
   * v2-2-2: Re-apply animation state when fullscreen toggles (DOM may be recreated).
   *
   * Uses MutationObserver to detect when slide HTML is actually injected,
   * ensuring animations are applied after content exists in DOM.
   */
  useEffect(() => {
    console.log('[useAnimations] Effect running:', { hasAnimations, totalGroups, currentBuildStep, isFullscreen: state.fullscreenMode !== null });

    if (!hasAnimations) {
      console.log('[useAnimations] No animations, skipping');
      slideContainerRef.current = null;
      return;
    }

    // Clear cached ref to force fresh DOM lookup after fullscreen toggle
    slideContainerRef.current = null;

    // Determine whether to show or hide groups based on navigation direction or current step
    // When fullscreen toggles, maintain current build step rather than resetting
    const shouldShowAll = state.navigatedBackward;
    const currentStep = currentBuildStep;

    const applyInitialState = (container: ShadowRoot | HTMLElement) => {
      console.log('[useAnimations] applyInitialState:', { shouldShowAll, currentStep, groupCount: buildGroups.length });

      // Verify container has actual slide content (not just the injected style tag).
      // The shadow root always has a <style data-shadow-animations> tag as first child.
      // Look for elements beyond just style tags to confirm slide HTML is loaded.
      const hasSlideContent = Array.from(container.children).some(
        child => child.tagName !== 'STYLE'
      );
      if (!hasSlideContent) {
        console.log('[useAnimations] Container has no slide content yet, waiting');
        return false;
      }

      // Assign data-build-id attributes to elements in the shadow DOM.
      // These are lost when shadowRoot.innerHTML is reset (e.g., mode change,
      // slide navigation) since the builder only assigns them at runtime.
      assignBuildIds(container);

      // Non-fullscreen: show all groups visible immediately (no animation hiding)
      if (state.fullscreenMode === null) {
        buildGroups.forEach((group) => {
          showGroup(group, container, true);
        });
        dispatch({ type: 'SET_BUILD_STEP', step: totalGroups });
        return true;
      }

      if (shouldShowAll || currentStep >= totalGroups) {
        // AC-7: Previous slide should be fully built, OR
        // All groups already revealed (fullscreen toggle after non-fullscreen showed all)
        buildGroups.forEach((group) => {
          showGroup(group, container, true);
        });
        if (currentStep < totalGroups) {
          dispatch({ type: 'SET_BUILD_STEP', step: totalGroups });
        }
      } else if (currentStep > 0) {
        // Re-applying state after fullscreen toggle - restore current build step
        // Set each group's visibility directly without hide-all-first to avoid visual flash
        buildGroups.forEach((group, index) => {
          if (index < currentStep) {
            showGroup(group, container, true);
          } else {
            hideGroup(group, container);
          }
        });
      } else {
        // AC-1: Hide all animation groups initially (entering fullscreen fresh, step=0)
        console.log('[useAnimations] Hiding all groups initially');
        buildGroups.forEach((group) => {
          hideGroup(group, container);
        });
      }
      return true;
    };

    let observer: MutationObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tryApplyAnimations = () => {
      const container = getSlideContainer();
      console.log('[useAnimations] Container found:', !!container, 'childCount:', container?.children.length);

      if (!container) {
        console.log('[useAnimations] Container not found, retrying in 50ms');
        timeoutId = setTimeout(tryApplyAnimations, 50);
        return;
      }

      // Try to apply animations
      const applied = applyInitialState(container);

      if (!applied) {
        // Container exists but is empty - watch for content being added
        console.log('[useAnimations] Setting up MutationObserver for content');
        observer = new MutationObserver((mutations) => {
          // Check if children were added
          const hasChildNodes = mutations.some(m => m.addedNodes.length > 0);
          if (hasChildNodes && container.children.length > 0) {
            console.log('[useAnimations] Content detected via MutationObserver');
            observer?.disconnect();
            observer = null;
            // Use requestAnimationFrame to ensure DOM is painted
            requestAnimationFrame(() => {
              applyInitialState(container);
            });
          }
        });
        observer.observe(container, { childList: true, subtree: true });

        // Fallback: retry after a delay in case observer doesn't fire
        timeoutId = setTimeout(() => {
          if (container.children.length > 0) {
            console.log('[useAnimations] Content found via fallback timeout');
            observer?.disconnect();
            observer = null;
            applyInitialState(container);
          }
        }, 100);
      }
    };

    // Start the process
    tryApplyAnimations();

    // Cleanup
    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [state.currentSlide, state.navigatedBackward, state.fullscreenMode, hasAnimations, totalGroups, buildGroups, hideGroup, showGroup, getSlideContainer, dispatch]);

  /**
   * Reveal the next animation group.
   * AC-3: Space/Right reveals next group with fade-in transition.
   * @returns true if a group was revealed, false if already at end
   */
  const revealNextGroup = useCallback((): boolean => {
    if (currentBuildStep >= totalGroups) {
      return false; // Already fully revealed
    }

    const container = getSlideContainer();
    if (!container || !buildGroups[currentBuildStep]) {
      return false;
    }

    // Reveal the next group
    showGroup(buildGroups[currentBuildStep], container);
    dispatch({ type: 'ADVANCE_BUILD' });
    return true;
  }, [currentBuildStep, totalGroups, buildGroups, getSlideContainer, showGroup, dispatch]);

  /**
   * Hide the last revealed animation group.
   * AC-5: Left Arrow hides last revealed group (reverse build).
   * @returns true if a group was hidden, false if already at step 0
   */
  const hideLastGroup = useCallback((): boolean => {
    if (currentBuildStep <= 0) {
      return false; // Nothing revealed to hide
    }

    const container = getSlideContainer();
    const groupIndex = currentBuildStep - 1;
    if (!container || !buildGroups[groupIndex]) {
      return false;
    }

    // Hide the last revealed group
    hideGroup(buildGroups[groupIndex], container);
    dispatch({ type: 'SET_BUILD_STEP', step: currentBuildStep - 1 });
    return true;
  }, [currentBuildStep, buildGroups, getSlideContainer, hideGroup, dispatch]);

  /**
   * Reveal all animation groups instantly.
   * AC-8: S key reveals all groups instantly (skip-all).
   */
  const revealAll = useCallback(() => {
    const container = getSlideContainer();
    if (!container) return;

    // Reveal all groups instantly
    buildGroups.forEach((group) => {
      showGroup(group, container, true);
    });
    dispatch({ type: 'SET_BUILD_STEP', step: totalGroups });
  }, [buildGroups, totalGroups, getSlideContainer, showGroup, dispatch]);

  /**
   * Set slide to fully built state.
   * AC-7: Used when navigating to previous slide.
   */
  const setFullyBuilt = useCallback(() => {
    const container = getSlideContainer();
    if (!container) return;

    // Reveal all groups instantly
    buildGroups.forEach((group) => {
      showGroup(group, container, true);
    });
    dispatch({ type: 'SET_BUILD_STEP', step: totalGroups });
  }, [buildGroups, totalGroups, getSlideContainer, showGroup, dispatch]);

  return {
    currentBuildStep,
    totalGroups,
    hasAnimations,
    revealNextGroup,
    hideLastGroup,
    revealAll,
    setFullyBuilt,
  };
}
