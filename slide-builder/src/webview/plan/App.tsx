/**
 * App - Root component for the Plan Editor webview.
 *
 * Story Reference: 18-3 Task 2 - Create App root component with context
 * Story Reference: 19-1 Task 6 - Integrate SlideGrid
 * Story Reference: 19-3 Task 3 - Integrate TopBar and NarrativeBar
 * Story Reference: 20-1 Task 6 - Integrate EditPanel into App layout
 * Architecture Reference: notes/architecture/architecture.md#Project Structure
 *
 * AC-18.3.3: App.tsx wraps children with PlanContext provider
 * AC-18.3.5: Webview sends { type: 'ready' } on mount
 * AC-19.1.1-11: SlideGrid integration
 * AC-19.3.1-7: TopBar and NarrativeBar integration
 * AC-20.1.2: EditPanel appears on right side of layout
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlanProvider, usePlan, usePlanData, useSelectedSlide } from './context/PlanContext';
import { useVSCodeApi } from './hooks/useVSCodeApi';
import { SlideGrid, TopBar, NarrativeBar, EditPanel, EditWithClaudeDialog } from './components';
import { getAgendaSections } from '../../shared/types';
import type { ExtensionMessage, SlideEntry } from '../../shared/types';

// =============================================================================
// Main App Content (inside provider)
// =============================================================================

function AppContent(): React.ReactElement {
  const { dispatch } = usePlan();
  const { postMessage, onMessage } = useVSCodeApi();
  // cv-2-5 AC-3: Track whether deck has built slides for View Slides button state
  const [hasBuiltSlides, setHasBuiltSlides] = useState<boolean | undefined>(undefined);
  // BR-2.2: Toast message for build-all feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AC-18.3.5: Send ready message on mount
  useEffect(() => {
    postMessage({ type: 'ready' });
  }, [postMessage]);

  // Subscribe to messages from extension
  useEffect(() => {
    return onMessage((message: ExtensionMessage) => {
      switch (message.type) {
        case 'plan-updated':
          dispatch({
            type: 'SET_PLAN',
            plan: message.plan,
            validationWarnings: message.validationWarnings,
          });
          break;

        case 'templates-loaded':
          // Task 5.4: Debug logging for template loading
          console.log(`Received ${message.templates.length} templates`);
          dispatch({
            type: 'SET_TEMPLATES',
            templates: message.templates,
          });
          break;

        case 'theme-loaded':
          // Task 5.4: Debug logging for theme loading
          console.log(`Received theme: ${message.theme ? 'loaded' : 'null'}`);
          dispatch({
            type: 'SET_THEME',
            theme: message.theme,
          });
          break;

        case 'confidence-scores':
          dispatch({
            type: 'SET_CONFIDENCE_SCORES',
            scores: message.scores,
          });
          break;

        case 'build-status-changed':
          // BR-1.1 AC-7: Dispatch status update to PlanContext so SlideCard re-renders
          dispatch({
            type: 'UPDATE_SLIDE_STATUS',
            slideNumber: message.slideNumber,
            status: message.status as 'pending' | 'built',
          });
          break;

        case 'deck-build-status':
          // cv-2-5 AC-3: Update hasBuiltSlides for View Slides button
          setHasBuiltSlides(message.hasBuiltSlides);
          break;

        case 'build-all-result':
          // BR-2.2: Show inline toast when all slides already built
          if (message.allBuilt) {
            setToastMessage(`All ${message.totalCount} slides already built`);
            setTimeout(() => setToastMessage(null), 4000);
          }
          break;
      }
    });
  }, [onMessage, dispatch]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-atmosphere relative">
      <PlanEditor hasBuiltSlides={hasBuiltSlides} />
      {/* BR-2.2: Inline toast for build-all feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-[var(--success,#22c55e)] text-white text-sm font-medium shadow-lg" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Plan Editor with SlideGrid and EditPanel (Story 19-1, 19-3, 20-1)
// =============================================================================

function PlanEditor({ hasBuiltSlides }: { hasBuiltSlides?: boolean }): React.ReactElement {
  const plan = usePlanData();
  const selectedSlideNumber = useSelectedSlide();
  const { dispatch } = usePlan();
  const { postMessage, postEditSlide } = useVSCodeApi();

  // Default values for when plan is not loaded
  const defaultAudience = { description: '', knowledge_level: 'intermediate' as const, priorities: [] };
  const defaultStoryline = { opening_hook: '', tension: '', resolution: '', call_to_action: '' };

  // Get the selected slide entry from the plan
  const selectedSlide: SlideEntry | null = useMemo(() => {
    if (!plan || selectedSlideNumber === null) return null;
    return plan.slides?.find((s) => s.number === selectedSlideNumber) ?? null;
  }, [plan, selectedSlideNumber]);

  // Get agenda sections (handles both nested and direct formats)
  const sections = useMemo(() => getAgendaSections(plan), [plan]);

  // Claude dialog state - shared between plan-level and slide-level
  const [claudeDialogOpen, setClaudeDialogOpen] = useState(false);
  const [claudeDialogSlideNumber, setClaudeDialogSlideNumber] = useState<number | null>(null);

  // AC-2: Plan-level Claude handler - opens dialog with no slideNumber
  const handleOpenPlanClaude = useCallback(() => {
    setClaudeDialogSlideNumber(null);
    setClaudeDialogOpen(true);
  }, []);

  // Slide-level Claude handler - opens dialog with slideNumber
  const handleOpenSlideClaude = useCallback((slideNumber: number) => {
    setClaudeDialogSlideNumber(slideNumber);
    setClaudeDialogOpen(true);
  }, []);

  // Submit handler for Claude dialog - sends instruction with message
  const handleClaudeSubmit = useCallback((instruction: string) => {
    postMessage({
      type: 'open-claude',
      ...(claudeDialogSlideNumber !== null && { slideNumber: claudeDialogSlideNumber }),
      instruction,
    });
    setClaudeDialogOpen(false);
  }, [postMessage, claudeDialogSlideNumber]);

  const handleClaudeCancel = useCallback(() => {
    setClaudeDialogOpen(false);
  }, []);

  // cv-2-5 AC-2: View Slides handler - opens Slide Viewer panel
  const handleViewSlides = useCallback(() => {
    postMessage({ type: 'open-slide-viewer' });
  }, [postMessage]);

  // cv-3-4 AC-24, AC-30: Build All handler - triggers build via Claude Code
  const handleBuildAll = useCallback(() => {
    postMessage({ type: 'build-all' });
  }, [postMessage]);

  // BR-1.3 AC-14: Build single slide handler - sends build-slide message to extension host
  const handleBuildSlide = useCallback((slideNumber: number) => {
    postMessage({ type: 'build-slide', slideNumber });
  }, [postMessage]);

  // AC-20.1.7: Handle edit callback - sends edit-slide message via debounced postEditSlide
  const handleEdit = useCallback(
    (field: string, value: unknown) => {
      if (selectedSlideNumber !== null) {
        postEditSlide(selectedSlideNumber, field, value);
      }
    },
    [selectedSlideNumber, postEditSlide]
  );

  // AC-21.1.5, AC-21.1.9: Handle delete - sends delete-slide message and adjusts selection
  const handleDelete = useCallback(
    (slideNumber: number) => {
      const slides = plan?.slides ?? [];
      const slideIndex = slides.findIndex((s) => s.number === slideNumber);

      // AC-21.1.11: Post-delete selection logic
      let nextSelection: number | null = null;
      if (slides.length > 1) {
        if (slideIndex < slides.length - 1) {
          // Select next slide (will be renumbered, so use current next slide's number - 1 after renumber)
          // After deletion and renumber, the slide that was at slideIndex+1 will be at slideIndex
          // Its new number will be slideIndex + 1
          nextSelection = slideIndex + 1;
        } else {
          // Deleted last slide, select previous (its number won't change after renumber)
          nextSelection = slideIndex; // previous slide's new number = slideIndex
        }
      }

      // Send delete message
      postMessage({ type: 'delete-slide', slideNumber });

      // Pre-emptively update selection (will be confirmed by plan-updated)
      dispatch({ type: 'SELECT_SLIDE', slideNumber: nextSelection });
    },
    [plan, postMessage, dispatch]
  );

  return (
    <div className="flex flex-col h-screen">
      {/* AC-19.3.3: Sticky header with TopBar and NarrativeBar */}
      <header className="sticky top-0 z-10 bg-[var(--bg)] backdrop-blur-sm bg-opacity-95">
        {/* AC-19.3.1, AC-19.3.2, AC-19.3.6, AC-19.3.7: TopBar with deck metadata */}
        <TopBar
          deckName={plan?.deck_name ?? 'Plan Editor'}
          audience={plan?.audience ?? defaultAudience}
          purpose={plan?.purpose ?? ''}
          onBuildAll={handleBuildAll}
          onOpenClaude={handleOpenPlanClaude}
          onViewSlides={handleViewSlides}
          hasBuiltSlides={hasBuiltSlides}
          slides={plan?.slides ?? []}
        />

        {/* AC-19.3.3, AC-19.3.4, AC-19.3.5: NarrativeBar with storyline flow */}
        {plan?.storyline && (
          <NarrativeBar storyline={plan.storyline ?? defaultStoryline} />
        )}
      </header>

      {/* AC-20.1.2: Split layout - SlideGrid (flex) + EditPanel (fixed 400px) */}
      <div className="flex flex-1 overflow-hidden">
        {/* SlideGrid - AC-19.1.1-11, AC-21.1.1-4 */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <SlideGrid />
          </div>
        </main>

        {/* EditPanel - AC-20.1.1-12, AC-21.1.5-8 */}
        <EditPanel
          slide={selectedSlide}
          sections={sections}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenClaude={handleOpenSlideClaude}
        />
      </div>

      {/* EditWithClaudeDialog - story-claude-edit-modal-1 */}
      <EditWithClaudeDialog
        open={claudeDialogOpen}
        slideNumber={claudeDialogSlideNumber}
        onSubmit={handleClaudeSubmit}
        onCancel={handleClaudeCancel}
      />
    </div>
  );
}

// =============================================================================
// App Root with Provider
// AC-18.3.3: App.tsx wraps children with PlanContext provider
// =============================================================================

export function App(): React.ReactElement {
  return (
    <PlanProvider>
      <AppContent />
    </PlanProvider>
  );
}
