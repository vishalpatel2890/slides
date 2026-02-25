import React, { useEffect } from 'react';
import type { BuildModeState } from '../context/ViewerContext';

/**
 * Props for BuildProgressBar component.
 * Story Reference: lv-2-2 AC-13 through AC-18, AC-25
 */
export interface BuildProgressBarProps {
  buildMode: BuildModeState;
  onDismiss: () => void;
}

/**
 * BuildProgressBar renders a thin progress bar at the top of the viewer
 * during builds. Shows progress, completion, cancellation, and error states.
 *
 * Story Reference: lv-2-2 AC-13 (FR11, FR15): Thin progress bar at top of viewer
 * Story Reference: lv-2-2 AC-14 (FR12): Incremental progress updates
 * Story Reference: lv-2-2 AC-15 (FR13): Auto-dismiss after 4 seconds on success
 * Story Reference: lv-2-2 AC-16 (FR14): Cancelled state persists until dismissed
 * Story Reference: lv-2-2 AC-17 (FR14): Error state persists until dismissed
 * Story Reference: lv-2-2 AC-18 (FR19): Click dismisses immediately
 * Story Reference: lv-2-2 AC-25: VS Code CSS variables for theming
 * Architecture Reference: Pattern 7 — BuildProgressBar Component
 */
export function BuildProgressBar({ buildMode, onDismiss }: BuildProgressBarProps): React.ReactElement | null {
  // AC-13: Render nothing when idle
  if (buildMode.status === 'idle') {
    return null;
  }

  const { builtCount, totalSlides, status, completedAt } = buildMode;
  const progressPercent = totalSlides > 0 ? (builtCount / totalSlides) * 100 : 0;

  // AC-14: Status text based on current state
  let statusText = '';
  switch (status) {
    case 'building':
      // Show "Building slide M+1 of N..." (next slide being built)
      statusText = `Building slide ${builtCount + 1} of ${totalSlides}...`;
      break;
    case 'complete':
      statusText = `All ${totalSlides} slides built`;
      break;
    case 'cancelled':
      statusText = `Build cancelled (${builtCount} of ${totalSlides} built)`;
      break;
    case 'error':
      statusText = `Build completed with errors (${builtCount} of ${totalSlides} built)`;
      break;
  }

  // AC-15: Auto-dismiss after 4 seconds on successful completion only
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (completedAt && status === 'complete') {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [completedAt, status, onDismiss]);

  // Determine if we should show the fade-out effect
  const isFadingOut = status === 'complete' && completedAt !== null;

  return (
    <div
      className="build-progress-bar"
      onClick={onDismiss}
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={statusText}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        borderBottom: '1px solid var(--vscode-panel-border, #333)',
        cursor: 'pointer',
        opacity: isFadingOut ? 0.7 : 1,
        transition: 'opacity 1s ease',
        padding: '4px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: 'var(--vscode-foreground, #ccc)',
        userSelect: 'none',
      }}
    >
      {/* Progress fill bar */}
      <div
        className="build-progress-bar__track"
        style={{
          flex: 1,
          height: '3px',
          backgroundColor: 'var(--vscode-panel-border, #333)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          className="build-progress-bar__fill"
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: 'var(--vscode-progressBar-background, #0e70c0)',
            transition: 'width 0.3s ease',
            borderRadius: '2px',
          }}
        />
      </div>

      {/* Status text */}
      <span className="build-progress-bar__text">
        {statusText}
      </span>

      {/* Dismiss hint for non-building states */}
      {status !== 'building' && (
        <span
          className="build-progress-bar__dismiss"
          style={{
            opacity: 0.6,
            fontSize: '11px',
          }}
        >
          Click to dismiss
        </span>
      )}
    </div>
  );
}
