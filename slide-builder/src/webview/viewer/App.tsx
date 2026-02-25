import React, { useEffect, useRef } from 'react';
import type { ViewerV2ExtensionMessage } from '../../shared/types';
import { useViewerState, useViewerDispatch, useCurrentSlide } from './context/ViewerContext';
import { SlideDisplay } from './components/SlideDisplay';
import { EmptyStateV2 } from './components/EmptyStateV2';
import { NavigationArrows } from './components/NavigationArrows';
import { ThumbnailSidebar } from './components/ThumbnailSidebar';
import { Toolbar } from './components/Toolbar';
import { StatusBar } from './components/StatusBar';
import { FullscreenWrapper } from './components/FullscreenWrapper';
import { FullscreenControls } from './components/FullscreenControls';
import { useVsCodeApi } from './hooks/useVsCodeApi';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useFullscreen } from './hooks/useFullscreen';
import { useAnimations } from './hooks/useAnimations';
import { useLiveEdit } from './hooks/useLiveEdit';
import { useExport } from './hooks/useExport';
import { useBuildMode } from './hooks/useBuildMode';
import { LiveEditOverlay } from './components/LiveEditOverlay';
import { AnimationBuilder } from './components/AnimationBuilder';
import { BuildProgressBar } from './components/BuildProgressBar';
import { FullscreenEditToolbar } from './components/FullscreenEditToolbar';

/**
 * V2 Viewer webview root component.
 * Uses ViewerContext for state management and listens for v2- prefixed messages.
 *
 * Story Reference: v2-1-1 AC-2, AC-6
 * Story Reference: v2-1-2 AC-4,10 - SlideDisplay and EmptyState integration
 * Story Reference: v2-1-3 AC1-9 - Keyboard navigation and SlideCounter
 * Story Reference: v2-1-4 AC1-6 - Thumbnail sidebar with click navigation
 * Story Reference: v2-2-1 AC1-11 - Toolbar and sidebar controls
 * Story Reference: v2-2-2 AC1-9 - Fullscreen presentation mode
 * Story Reference: v2-2-3 AC1-11 - Build animation playback
 * Story Reference: v2-3-1 AC1-11 - Live text editing with disk persistence
 * Story Reference: v2-4-2 AC1-10 - Animation builder mode
 */
export function App(): React.ReactElement {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const currentSlide = useCurrentSlide();
  const { postMessage } = useVsCodeApi();
  const containerRef = useRef<HTMLDivElement>(null);

  // ae-1-3: Ref to track aiEditInFlight inside message handler without stale closure
  const aiEditInFlightRef = useRef(state.aiEditInFlight);
  useEffect(() => {
    aiEditInFlightRef.current = state.aiEditInFlight;
  }, [state.aiEditInFlight]);

  // story-1.2: Ref to track aiAnimateInFlight inside message handler without stale closure
  const aiAnimateInFlightRef = useRef(state.aiAnimateInFlight);
  useEffect(() => {
    aiAnimateInFlightRef.current = state.aiAnimateInFlight;
  }, [state.aiAnimateInFlight]);

  // v2-2-3: Animation playback state and handlers
  const animations = useAnimations(state.manifest);

  // v2-1-3 + v2-2-3: Keyboard navigation with animation awareness
  useKeyboardNav(containerRef, animations);

  // v2-2-2 + v3-1: Fullscreen presentation mode with view/edit differentiation
  const { fullscreenMode, isFullscreen, showControls, handleMouseMove, enterFullscreen, exitFullscreen } = useFullscreen();

  // v2-3-1: Live text editing with debounced save
  const liveEdit = useLiveEdit();

  // v2-5-1: Export capture pipeline for PNG and PDF
  const exportActions = useExport();

  // lv-1-1 AC-11: Activate build mode message listening
  // lv-2-2 AC-23,24: Destructure buildMode and dismissBuildBar for BuildProgressBar
  const { buildMode, dismissBuildBar } = useBuildMode();

  // Listen for V2 messages from extension host
  useEffect(() => {
    function handleMessage(event: MessageEvent<ViewerV2ExtensionMessage>) {
      const message = event.data;
      if (!message || typeof message.type !== 'string') return;

      switch (message.type) {
        case 'v2-deck-loaded':
          dispatch({ type: 'SET_DECK_CONTENT', deck: message.deck });
          break;
        case 'v2-slide-updated':
          dispatch({
            type: 'UPDATE_SLIDE',
            slideNumber: message.slideNumber,
            html: message.html,
          });
          // ae-1-3 AC-18: Reset in-flight state when slide update arrives during AI edit
          // story-ai-edit-refresh-1 AC#2: Auto-navigate to edited slide
          if (aiEditInFlightRef.current) {
            dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: false });
            dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber: message.slideNumber });
          }
          // story-1.2: Reset animate in-flight when slide/manifest update arrives
          if (aiAnimateInFlightRef.current) {
            dispatch({ type: 'SET_AI_ANIMATE_IN_FLIGHT', inFlight: false });
          }
          break;
        case 'v2-manifest-updated':
          // v2-3-2 AC-7: External manifest.json change — update animation data
          dispatch({ type: 'SET_MANIFEST', manifest: message.manifest });
          break;
        case 'v2-error':
          dispatch({ type: 'SET_ERROR', error: message.message });
          break;
        case 'v2-rebuilding':
          // Build progress is tracked in catalog sidebar (cv-3-5)
          // Viewer continues displaying current slide
          break;
        case 'v2-refreshed':
          // Refresh handled by deck reload in extension
          break;
        case 'v2-reorder-result':
          // v2-4-1 AC-8: Handle reorder result
          if (message.success) {
            // Optimistic update already applied, persistence confirmed
            console.log('[V2 Viewer] Slide reorder persisted successfully');
          } else {
            // v2-4-1 AC-8: On failure, show error (optimistic update remains, user may need to refresh)
            console.error(`[V2 Viewer] Slide reorder failed: ${message.error}`);
            // Show error in status bar area (could be enhanced with proper error state)
            dispatch({ type: 'SET_ERROR', error: `Reorder failed: ${message.error}. Refresh viewer to restore correct order.` });
          }
          break;
        case 'v2-save-result':
          // v2-3-1: Save result handling (already handled in useLiveEdit)
          break;
        case 'v2-template-context':
          // tm-3-5: Store template context for viewer Edit button (AC-5)
          dispatch({ type: 'SET_TEMPLATE_CONTEXT', context: message.context });
          break;
        case 'v2-edit-started':
          // ae-1-3 AC-22: Handle CC launch result
          if (!message.success) {
            // CC launch failed — immediately reset in-flight state
            dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: false });
            console.error(`[V2 Viewer] Edit with AI failed: ${message.error || 'Unknown error'}`);
          }
          break;
        case 'v2-animate-started':
          // story-1.2 AC-6,11: Handle animate CC launch result
          if (!message.success) {
            dispatch({ type: 'SET_AI_ANIMATE_IN_FLIGHT', inFlight: false });
            console.error(`[V2 Viewer] Animate with AI failed: ${message.error || 'Unknown error'}`);
          }
          break;
        case 'v2-add-slide-started':
          // story-viewer-add-slide-2 AC#4,8: Handle add slide CC launch result
          dispatch({ type: 'SET_AI_ADD_SLIDE_IN_FLIGHT', inFlight: false });
          if (message.success && message.newSlideNumber) {
            // AC#4: Set pending slide number for auto-navigate on arrival
            dispatch({ type: 'SET_PENDING_ADD_SLIDE', slideNumber: message.newSlideNumber });
          } else if (!message.success) {
            // AC#8: CC launch failed — show error
            console.error(`[V2 Viewer] Add Slide failed: ${message.error || 'Unknown error'}`);
          }
          break;
        case 'v2-export-ready':
          // v2-5-1: Export file saved confirmation from extension host
          console.log(`[V2 Viewer] Export saved: ${message.fileName}`);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch]);

  // ae-1-3 AC-19: 120-second safety timeout for in-flight state
  useEffect(() => {
    if (!state.aiEditInFlight) return;

    const timeoutId = setTimeout(() => {
      dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: false });
      console.warn('[V2 Viewer] AI edit in-flight timeout (120s) — resetting button state');
    }, 120_000);

    return () => clearTimeout(timeoutId);
  }, [state.aiEditInFlight, dispatch]);

  // story-1.2: 120-second safety timeout for animate in-flight state
  useEffect(() => {
    if (!state.aiAnimateInFlight) return;

    const timeoutId = setTimeout(() => {
      dispatch({ type: 'SET_AI_ANIMATE_IN_FLIGHT', inFlight: false });
      console.warn('[V2 Viewer] AI animate in-flight timeout (120s) — resetting button state');
    }, 120_000);

    return () => clearTimeout(timeoutId);
  }, [state.aiAnimateInFlight, dispatch]);

  // story-viewer-add-slide-2 AC#7: 180-second safety timeout for pending add slide
  useEffect(() => {
    if (state.pendingAddSlideNumber === null) return;

    const timeoutId = setTimeout(() => {
      dispatch({ type: 'SET_PENDING_ADD_SLIDE', slideNumber: null });
      console.warn('[V2 Viewer] Pending add slide timeout (180s) — clearing pending state');
    }, 180_000);

    return () => clearTimeout(timeoutId);
  }, [state.pendingAddSlideNumber, dispatch]);

  // AC-2: Loading state shows "Loading slides..."
  if (state.isLoading) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
        <p className="viewer-loading__text">Loading slides...</p>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="viewer-error">
        <h2>Error</h2>
        <p>{state.error}</p>
      </div>
    );
  }

  // AC-10: Empty state - no slides built yet
  if (state.slides.length === 0) {
    return <EmptyStateV2 postMessage={postMessage} />;
  }

  // Navigation handlers for SlideCounter and NavigationArrows
  function handleNavigate(slideNumber: number) {
    dispatch({ type: 'SET_CURRENT_SLIDE', slideNumber });
  }

  function handlePrev() {
    dispatch({ type: 'NAVIGATE_PREV' });
  }

  function handleNext() {
    dispatch({ type: 'NAVIGATE_NEXT' });
  }

  // Click-to-advance in fullscreen: animation-aware (reveals build groups before navigating)
  function handleFullscreenAdvance() {
    if (animations.hasAnimations) {
      const revealed = animations.revealNextGroup();
      if (revealed) return;
    }
    dispatch({ type: 'NAVIGATE_NEXT' });
  }

  // Main viewer - slides loaded
  // AC-4,5,6,7: SlideDisplay renders via innerHTML with proper styling
  // v2-1-3 AC7-9: SlideCounter and NavigationArrows
  // v2-1-4 AC1-6: ThumbnailSidebar with click navigation
  // v2-2-1 AC1-11: Toolbar and sidebar controls
  // v2-2-2 AC1-9: Fullscreen presentation mode
  return (
    <div className="viewer-root" ref={containerRef} tabIndex={-1}>
      {/* lv-2-2 AC-24: BuildProgressBar above slide content area */}
      <BuildProgressBar buildMode={buildMode} onDismiss={dismissBuildBar} />

      {/* v2-2-1: Toolbar at top - hidden in fullscreen (AC-3) */}
      {!isFullscreen && (
        <Toolbar
          onPrev={handlePrev}
          onNext={handleNext}
          onNavigate={handleNavigate}
          exportActions={exportActions}
        />
      )}

      {/* lv-2-2 AC-24: Add padding-top when build bar is visible to prevent content overlap */}
      <div className="viewer-body" style={buildMode.status !== 'idle' ? { paddingTop: '28px' } : undefined}>
        {/* v2-1-4: Thumbnail sidebar on left - hidden in fullscreen (AC-3) */}
        {!isFullscreen && (
          <ThumbnailSidebar
            slides={state.slides}
            currentSlide={state.currentSlide}
            onNavigate={handleNavigate}
            collapsed={!state.sidebarVisible}
          />
        )}

        {/* Main content area */}
        <div className="viewer-main">
          {currentSlide ? (
            <>
              {/* v2-2-2 + v3-1: Wrap SlideDisplay in FullscreenWrapper with mode */}
              <FullscreenWrapper
                mode={fullscreenMode}
                onMouseMove={handleMouseMove}
                onClick={handleFullscreenAdvance}
              >
                <SlideDisplay
                  slideHtml={currentSlide.html}
                  slideNumber={currentSlide.number}
                  slideTitle={currentSlide.title}
                />
              </FullscreenWrapper>

              {/* v2-3-1: Live edit overlay - manages contenteditable interactions */}
              {/* v3-1-1 AC-3: NOT active in fullscreen view mode */}
              {/* v3-1-2 AC-2: Active in fullscreen edit mode (contenteditable enabled) */}
              {(state.mode === 'live-edit' || fullscreenMode === 'edit') && fullscreenMode !== 'view' && (
                <LiveEditOverlay
                  liveEdit={liveEdit}
                  slideNumber={state.currentSlide}
                />
              )}

              {/* v2-4-2: Animation builder overlay - element selection and group creation */}
              {state.mode === 'animation-builder' && <AnimationBuilder />}

              {/* Navigation arrows - normal mode only (replaced by FullscreenControls in fullscreen) */}
              {!isFullscreen && (
                <NavigationArrows onPrev={handlePrev} onNext={handleNext} />
              )}

              {/* v2-2-2 AC-5,6: Fullscreen navigation controls (view mode only) */}
              {/* v2-2-3: Pass animation state for BuildStepIndicator in fullscreen */}
              {fullscreenMode === 'view' && (
                <FullscreenControls
                  visible={showControls}
                  onPrev={handlePrev}
                  onNext={handleNext}
                  currentSlide={state.currentSlide}
                  totalSlides={state.slides.length}
                  currentBuildStep={animations.currentBuildStep}
                  totalGroups={animations.totalGroups}
                  hasAnimations={animations.hasAnimations}
                />
              )}

              {/* v3-1-2 AC-1,4: Minimal edit toolbar in fullscreen edit mode */}
              {fullscreenMode === 'edit' && (
                <FullscreenEditToolbar saveStatus={state.saveStatus} />
              )}
            </>
          ) : (
            <div className="viewer-no-slide">
              <p>Slide not found</p>
            </div>
          )}
        </div>
      </div>

      {/* v2-2-1: Status bar at bottom - hidden in fullscreen (AC-3) */}
      {/* Build step info is only relevant in fullscreen; StatusBar only renders in non-fullscreen */}
      {!isFullscreen && (
        <StatusBar
          currentBuildStep={0}
          totalGroups={0}
          hasAnimations={false}
        />
      )}
    </div>
  );
}
