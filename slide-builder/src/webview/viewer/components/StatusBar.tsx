import React from 'react';
import { useViewerState } from '../context/ViewerContext';
import { BuildStepIndicator } from './BuildStepIndicator';
import type { SaveStatus, ViewerState } from '../context/ViewerContext';
import type { ExportProgress } from '../../../shared/types';

/**
 * Props for StatusBar component.
 */
export interface StatusBarProps {
  /** Current animation build step (0 = nothing revealed) */
  currentBuildStep?: number;
  /** Total number of animation groups */
  totalGroups?: number;
  /** Whether current slide has animations */
  hasAnimations?: boolean;
}

/**
 * Status bar at the bottom of the viewer.
 * v2-2-1: 24px height strip for status indicators.
 * v2-2-3 AC-2,4,9: BuildStepIndicator showing "Build: N / Total" with step dots.
 * v2-3-1 AC-3.1.7,8: Save status display ("Saving...", "Saved ✓", "Save failed").
 *
 * Architecture Reference: Status bar from UX spec
 */
export function StatusBar({
  currentBuildStep = 0,
  totalGroups = 0,
  hasAnimations = false,
}: StatusBarProps): React.ReactElement {
  const state = useViewerState();

  // Determine mode indicator text
  let modeText = '';
  if (state.fullscreenMode !== null) {
    modeText = 'Fullscreen';
  } else if (state.mode === 'live-edit') {
    modeText = 'Edit Mode';
  }

  // Determine keyboard hint based on mode and animation state
  let keyboardHint: string;
  if (state.mode === 'live-edit') {
    keyboardHint = 'Click text to edit • Esc to exit • E to toggle edit mode';
  } else if (hasAnimations) {
    keyboardHint = '← → to navigate • Space to build • S to skip all • E to edit • F for fullscreen';
  } else {
    keyboardHint = '← → to navigate • E to edit • F for fullscreen';
  }

  return (
    <div className="viewer-status-bar" role="status" aria-live="polite">
      <div className="viewer-status-bar__left">
        {/* v2-2-3 AC-2,4,9,10: Build step indicator with dots */}
        <BuildStepIndicator
          currentBuildStep={currentBuildStep}
          totalGroups={totalGroups}
          visible={hasAnimations}
          variant="status-bar"
        />
      </div>

      <div className="viewer-status-bar__center">
        {/* v2-5-1 AC-7: Export progress indicator */}
        <ExportProgressIndicator exportProgress={state.exportProgress} />
        {/* v2-3-1 AC-3.1.7,8: Save status indicator */}
        <SaveStatusIndicator saveStatus={state.saveStatus} />
      </div>

      <div className="viewer-status-bar__right">
        {/* Mode indicator */}
        {modeText && (
          <span className="viewer-status-bar__mode">{modeText}</span>
        )}
        {/* Keyboard hint - updated for edit mode */}
        <span className="viewer-status-bar__hint">
          {keyboardHint}
        </span>
      </div>
    </div>
  );
}

/**
 * Save status indicator sub-component.
 * v2-3-1 AC-3.1.7: "Saving..." → "Saved ✓" transitions.
 * v2-3-1 AC-3.1.8: "Save failed" in red.
 */
function SaveStatusIndicator({ saveStatus }: { saveStatus: SaveStatus }): React.ReactElement | null {
  switch (saveStatus) {
    case 'saving':
      return <span className="save-status-saving" aria-label="Saving changes">Saving…</span>;
    case 'saved':
      return <span className="save-status-saved" aria-label="Changes saved">Saved ✓</span>;
    case 'error':
      return <span className="save-status-error" aria-label="Save failed">Save failed</span>;
    case 'idle':
    default:
      return null;
  }
}

/**
 * Export progress indicator sub-component.
 * v2-5-1 AC-7: Shows "Exporting PNG 3/10…" or "Exporting PDF 5/10…" during batch operations.
 */
function ExportProgressIndicator({ exportProgress }: { exportProgress: ExportProgress | null }): React.ReactElement | null {
  if (!exportProgress) return null;
  const label = exportProgress.format === 'pdf' ? 'PDF' : 'PNG';
  return (
    <span className="export-progress-indicator" aria-label={`Exporting ${label} ${exportProgress.current} of ${exportProgress.total}`}>
      Exporting {label} {exportProgress.current}/{exportProgress.total}…
    </span>
  );
}
