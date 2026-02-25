import React, { useState, useCallback } from 'react';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Pencil,
  SquarePen,
  Wand2,
  Loader2,
  FileEdit,
  Hammer,
  Presentation,
  Maximize,
  Minimize,
  Plus,
} from 'lucide-react';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import { useVsCodeApi } from '../hooks/useVsCodeApi';
import { SlideCounter } from './SlideCounter';
import { ExportMenu } from './ExportMenu';
import { EditWithAiModal } from './EditWithAiModal';
import { AddSlideModal } from './AddSlideModal';
import type { UseExportReturn } from '../hooks/useExport';

/**
 * Viewer toolbar with navigation, mode toggles, and action buttons.
 * v2-2-1 AC-1: 44px height, full width, dark background
 * v2-2-1 AC-2: Left section with sidebar toggle + deck name
 * v2-2-1 AC-3: Center section with navigation controls
 * v2-2-1 AC-4: Right section with mode toggles and action buttons
 * v2-2-1 AC-10: Ghost buttons with aria-labels
 */

interface ToolbarProps {
  /** Handler for previous slide navigation */
  onPrev: () => void;
  /** Handler for next slide navigation */
  onNext: () => void;
  /** Handler for jump-to-slide navigation */
  onNavigate: (slideNumber: number) => void;
  /** v2-5-1: Export actions from useExport hook */
  exportActions: UseExportReturn;
}

/**
 * Truncate deck name to specified length with ellipsis.
 * v2-2-1 AC-2: Truncate at 20 chars (15 for narrow)
 */
function truncateName(name: string, maxLength: number): string {
  if (!name || name.length <= maxLength) return name || '';
  return name.slice(0, maxLength - 1) + '…';
}

export function Toolbar({
  onPrev,
  onNext,
  onNavigate,
  exportActions,
}: ToolbarProps): React.ReactElement {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();

  // story-1.1: Derived build state for hammer badge (AC #1, #2, #3, #7)
  // plannedSlideCount = total slides in plan.yaml; slides.length = built HTML files
  const builtCount = state.slides.length;
  const totalCount = state.manifest?.plannedSlideCount ?? 0;
  const hasUnbuilt = totalCount > 0 && totalCount > builtCount;
  // DEBUG: remove after verification
  console.log('[Toolbar] build badge debug:', { builtCount, totalCount, hasUnbuilt, manifest: state.manifest });

  // v2-2-1 AC-5,6: Toggle sidebar visibility
  function handleToggleSidebar() {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }

  // v2-2-1 AC-7: Open plan editor
  function handleEditPlan() {
    postMessage({ type: 'v2-open-plan-editor' });
  }

  // v2-2-1 AC-8: Trigger rebuild
  function handleRebuild() {
    postMessage({ type: 'v2-rebuild' });
  }

  // story-1.1: Present deck in browser
  function handlePresent() {
    postMessage({ type: 'v2-present' });
  }

  // v3-1-1: Enter fullscreen view mode (toolbar button always enters view mode)
  function handleFullscreen() {
    const isFullscreen = state.fullscreenMode !== null;
    if (isFullscreen) {
      dispatch({ type: 'EXIT_FULLSCREEN' });
    } else {
      dispatch({ type: 'ENTER_FULLSCREEN_VIEW' });
    }
  }

  // v2-3-1 AC-3.1.1: Toggle edit mode
  function handleToggleEditMode() {
    if (state.mode === 'live-edit') {
      dispatch({ type: 'EXIT_EDIT_MODE' });
    } else if (state.mode === 'presentation') {
      dispatch({ type: 'ENTER_EDIT_MODE' });
    }
  }

  // v2-4-2 AC-1,9: Toggle animation builder mode
  function handleToggleBuilderMode() {
    if (state.mode === 'animation-builder') {
      dispatch({ type: 'EXIT_BUILDER_MODE' });
    } else if (state.mode === 'presentation') {
      dispatch({ type: 'ENTER_BUILDER_MODE' });
    }
    // Note: If in live-edit mode, button click does nothing (modes mutually exclusive)
  }

  // tm-3-5: Template edit modal state and handlers (AC-1, AC-2)
  const [templateEditModalOpen, setTemplateEditModalOpen] = useState(false);

  const handleTemplateEditClick = useCallback(() => {
    setTemplateEditModalOpen(true);
  }, []);

  const handleTemplateEditSubmit = useCallback((instruction: string) => {
    if (!state.templateContext) return;
    setTemplateEditModalOpen(false);
    // AC-3: Send v2-submit-edit-form with operation, data (including hidden templateId, slideFile)
    postMessage({
      type: 'v2-submit-edit-form',
      operation: 'sb-manage:edit-deck-template',
      data: {
        changes: instruction,
        templateId: state.templateContext.templateId,
        slideFile: state.templateContext.slideFile,
      },
    });
  }, [state.templateContext, postMessage]);

  const handleTemplateEditClose = useCallback(() => {
    setTemplateEditModalOpen(false);
  }, []);

  // story-1.2: Animate with AI button and modal handlers
  const isAnimateWithAiDisabled = !state.deckId || state.fullscreenMode !== null || state.aiAnimateInFlight;
  const animateWithAiTooltip = !state.deckId
    ? 'No slide loaded'
    : state.fullscreenMode !== null
      ? 'Exit fullscreen to animate with AI'
      : 'Animate with AI';

  function handleAnimateWithAiClick() {
    dispatch({ type: 'OPEN_ANIMATE_MODAL' });
  }

  // story-1.2 AC-1: Modal stays open after submit (no CLOSE_ANIMATE_MODAL dispatch)
  function handleAnimateWithAiSubmit(instruction: string) {
    dispatch({ type: 'SET_AI_ANIMATE_IN_FLIGHT', inFlight: true });
    postMessage({ type: 'v2-animate-with-ai', instruction, slideNumber: state.currentSlide });
  }

  function handleAnimateWithAiClose() {
    dispatch({ type: 'CLOSE_ANIMATE_MODAL' });
  }

  // story-viewer-add-slide-1: Add Slide button and modal handlers
  // AC-8: Disabled when no deck loaded, AC-9: Disabled in fullscreen, AC-10: Disabled when in flight
  const isAddSlideDisabled = !state.deckId || state.fullscreenMode !== null || state.aiAddSlideInFlight;
  const addSlideTooltip = !state.deckId
    ? 'No deck loaded'
    : state.fullscreenMode !== null
      ? 'Exit fullscreen to add slide'
      : 'Add slide';

  function handleAddSlideClick() {
    dispatch({ type: 'OPEN_ADD_SLIDE_MODAL' });
  }

  // AC-7: Submit sends position and description to extension
  function handleAddSlideSubmit(position: number | 'end', description: string) {
    dispatch({ type: 'CLOSE_ADD_SLIDE_MODAL' });
    dispatch({ type: 'SET_AI_ADD_SLIDE_IN_FLIGHT', inFlight: true });
    postMessage({ type: 'v2-add-slide', position, description });
  }

  function handleAddSlideClose() {
    dispatch({ type: 'CLOSE_ADD_SLIDE_MODAL' });
  }

  // ae-1-1: Edit with AI button and modal handlers
  const isEditWithAiDisabled = !state.deckId || state.fullscreenMode !== null || state.aiEditInFlight;
  const editWithAiTooltip = !state.deckId
    ? 'No slide loaded'
    : state.fullscreenMode !== null
      ? 'Exit fullscreen to edit with AI'
      : 'Edit with AI';

  function handleEditWithAiClick() {
    dispatch({ type: 'OPEN_EDIT_MODAL' });
  }

  function handleEditWithAiSubmit(instruction: string) {
    dispatch({ type: 'CLOSE_EDIT_MODAL' });
    dispatch({ type: 'SET_AI_EDIT_IN_FLIGHT', inFlight: true });
    postMessage({ type: 'v2-edit-with-ai', instruction, slideNumber: state.currentSlide });
  }

  function handleEditWithAiClose() {
    dispatch({ type: 'CLOSE_EDIT_MODAL' });
  }

  // v2-2-1 AC-2,9: Deck name truncation (20 chars default, 15 for narrow)
  // Responsive detection via CSS media query is handled by component
  const displayName = truncateName(state.deckName || '', 20);

  return (
    <>
    <div className="viewer-toolbar" role="toolbar" aria-label="Viewer controls">
      {/* Left section: Sidebar toggle + Deck name */}
      <div className="viewer-toolbar__left">
        <button
          type="button"
          className="viewer-toolbar__button"
          onClick={handleToggleSidebar}
          aria-label={state.sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          aria-pressed={state.sidebarVisible}
        >
          <Menu size={18} />
        </button>
        <span className="viewer-toolbar__deck-name" title={state.deckName || ''}>
          {displayName}
        </span>
      </div>

      {/* Center section: Navigation controls */}
      <div className="viewer-toolbar__center">
        <button
          type="button"
          className="viewer-toolbar__button"
          onClick={onPrev}
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <SlideCounter
          currentSlide={state.currentSlide}
          totalSlides={state.slides.length}
          onNavigate={onNavigate}
        />
        <button
          type="button"
          className="viewer-toolbar__button"
          onClick={onNext}
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Right section: Mode toggles + Actions — grouped as Slide Edit | Animation | Deck Actions | View */}
      <div className="viewer-toolbar__right">
        {/* Group 1: Slide Edit — Edit Mode + Edit with AI (or Template Edit for template slides) */}
        {!state.templateContext && (
          <button
            type="button"
            className={`viewer-toolbar__button${state.mode === 'live-edit' ? ' viewer-toolbar__button--edit-active' : ''}`}
            aria-label={state.mode === 'live-edit' ? 'Exit edit mode (E)' : 'Enter edit mode (E)'}
            aria-pressed={state.mode === 'live-edit'}
            title={state.mode === 'live-edit' ? 'Exit edit mode (E)' : 'Enter edit mode (E)'}
            onClick={handleToggleEditMode}
          >
            <Pencil size={18} />
          </button>
        )}
        {!state.templateContext && (
          <button
            type="button"
            className="viewer-toolbar__button"
            onClick={handleEditWithAiClick}
            disabled={isEditWithAiDisabled}
            aria-label="Edit with AI"
            title={editWithAiTooltip}
          >
            {state.aiEditInFlight ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Wand2 size={18} />
            )}
          </button>
        )}
        {state.templateContext && (
          <button
            type="button"
            className="viewer-toolbar__button"
            onClick={handleTemplateEditClick}
            aria-label="Edit template slide"
            title="Edit template slide"
          >
            <SquarePen size={18} />
          </button>
        )}

        {/* Separator 1: between Slide Edit and Animation */}
        <div className="viewer-toolbar__separator" aria-hidden="true" />

        {/* Group 2: Animation — Animation Builder toggle + Animate with AI */}
        <button
          type="button"
          className={`viewer-toolbar__button${state.mode === 'animation-builder' ? ' viewer-toolbar__button--builder-active' : ''}`}
          aria-label={state.mode === 'animation-builder' ? 'Exit animation builder (A)' : 'Animation builder (A)'}
          aria-pressed={state.mode === 'animation-builder'}
          title={state.mode === 'animation-builder' ? 'Exit animation builder (A)' : 'Animation builder (A)'}
          onClick={handleToggleBuilderMode}
          disabled={state.mode === 'live-edit'}
        >
          <Sparkles size={18} />
        </button>
        {/* story-1.2: Animate with AI button (Zap icon) — hidden for template slides */}
        {!state.templateContext && (
          <button
            type="button"
            className="viewer-toolbar__button"
            onClick={handleAnimateWithAiClick}
            disabled={isAnimateWithAiDisabled}
            aria-label="Animate with AI"
            title={animateWithAiTooltip}
          >
            {state.aiAnimateInFlight ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Zap size={18} />
            )}
          </button>
        )}

        {/* Separator 2: between Animation and Deck Actions */}
        <div className="viewer-toolbar__separator" aria-hidden="true" />

        {/* Group 3: Deck Actions — Add Slide, Edit Plan, Rebuild, Export */}
        {!state.templateContext && (
          <>
            {/* story-viewer-add-slide-1 AC-8,9,10: Add Slide button */}
            <button
              type="button"
              className="viewer-toolbar__button"
              onClick={handleAddSlideClick}
              disabled={isAddSlideDisabled}
              aria-label="Add slide"
              title={addSlideTooltip}
            >
              {state.aiAddSlideInFlight ? (
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Plus size={18} />
              )}
            </button>
            <button
              type="button"
              className="viewer-toolbar__button"
              onClick={handleEditPlan}
              aria-label="Edit plan"
              title="Open plan.yaml in editor"
            >
              <FileEdit size={18} />
            </button>
            <button
              type="button"
              className="viewer-toolbar__button"
              onClick={handleRebuild}
              aria-label={hasUnbuilt ? `Build slides (${builtCount}/${totalCount} built)` : 'Rebuild all slides'}
              title={hasUnbuilt ? `Build slides (${builtCount}/${totalCount} built)` : 'Rebuild all slides'}
            >
              <Hammer size={18} />
            </button>
            {hasUnbuilt && (
              <span className="viewer-toolbar__build-badge" aria-label={`${builtCount} of ${totalCount} slides built`}>
                {builtCount}/{totalCount}
              </span>
            )}
            <button
              type="button"
              className="viewer-toolbar__button"
              onClick={handlePresent}
              aria-label="Present in browser"
              title="Present in browser"
            >
              <Presentation size={18} />
            </button>
          </>
        )}
        <ExportMenu exportActions={exportActions} mode={state.mode} />

        {/* Separator 3: between Deck Actions and View */}
        <div className="viewer-toolbar__separator" aria-hidden="true" />

        {/* Group 4: View — Fullscreen toggle */}
        <button
          type="button"
          className="viewer-toolbar__button"
          onClick={handleFullscreen}
          aria-label={state.fullscreenMode !== null ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
          title={state.fullscreenMode !== null ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
        >
          {state.fullscreenMode !== null ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
    {/* ae-1-1: Edit with AI modal (for regular deck slides) */}
    <EditWithAiModal
      visible={state.showEditModal}
      slideNumber={state.currentSlide}
      onSubmit={handleEditWithAiSubmit}
      onClose={handleEditWithAiClose}
    />
    {/* story-1.2: Animate with AI modal (for regular deck slides) */}
    {!state.templateContext && (
      <EditWithAiModal
        visible={state.showAnimateModal}
        slideNumber={state.currentSlide}
        onSubmit={handleAnimateWithAiSubmit}
        onClose={handleAnimateWithAiClose}
        title="Animate with AI"
        placeholder="Describe animation style or leave empty for auto-detection..."
        allowEmpty
        inFlight={state.aiAnimateInFlight}
      />
    )}
    {/* tm-3-5: Edit Template modal (for template slides, matches Edit with AI UI) */}
    {state.templateContext && (
      <EditWithAiModal
        visible={templateEditModalOpen}
        slideNumber={state.currentSlide}
        onSubmit={handleTemplateEditSubmit}
        onClose={handleTemplateEditClose}
        title="Edit Template Slide"
        placeholder="Describe the changes you want to make to this template slide..."
      />
    )}
    {/* story-viewer-add-slide-1: Add Slide modal (for regular deck slides) */}
    {!state.templateContext && (
      <AddSlideModal
        visible={state.showAddSlideModal}
        currentSlide={state.currentSlide}
        totalSlides={state.slides.length}
        deckName={state.deckName || ''}
        onSubmit={handleAddSlideSubmit}
        onClose={handleAddSlideClose}
        inFlight={state.aiAddSlideInFlight}
      />
    )}
    </>
  );
}
