import React from 'react';

/**
 * Props for BuildStepIndicator component.
 */
export interface BuildStepIndicatorProps {
  /** Current build step (0 = nothing revealed) */
  currentBuildStep: number;
  /** Total number of animation groups */
  totalGroups: number;
  /** Whether to show the indicator (false hides it) */
  visible?: boolean;
  /** Optional variant for fullscreen mode styling */
  variant?: 'status-bar' | 'fullscreen';
}

/**
 * BuildStepIndicator displays the current animation build step.
 * v2-2-3 AC-2,4,9,10: Shows "Build: N / Total" with step dots.
 *
 * @param props - Component props
 * @returns React element or null if not visible
 */
export function BuildStepIndicator({
  currentBuildStep,
  totalGroups,
  visible = true,
  variant = 'status-bar',
}: BuildStepIndicatorProps): React.ReactElement | null {
  // AC-9: Hide when no animation groups or not visible
  if (!visible || totalGroups === 0) {
    return null;
  }

  // Generate step dots
  const dots = Array.from({ length: totalGroups }, (_, i) => {
    const isFilled = i < currentBuildStep;
    const dotClass = variant === 'fullscreen'
      ? `fullscreen-controls__build-dot${isFilled ? ' fullscreen-controls__build-dot--filled' : ''}`
      : `build-step-indicator__dot${isFilled ? ' build-step-indicator__dot--filled' : ''}`;

    return (
      <span
        key={i}
        className={dotClass}
        role="img"
        aria-label={isFilled ? 'revealed' : 'pending'}
      />
    );
  });

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div
        className="fullscreen-controls__build-indicator"
        role="status"
        aria-live="polite"
        aria-label={`Build step ${currentBuildStep} of ${totalGroups}`}
      >
        <span>Build: {currentBuildStep} / {totalGroups}</span>
        <div className="fullscreen-controls__build-dots">{dots}</div>
      </div>
    );
  }

  // Status bar variant (default)
  return (
    <div
      className="build-step-indicator"
      role="status"
      aria-live="polite"
      aria-label={`Build step ${currentBuildStep} of ${totalGroups}`}
    >
      <span className="build-step-indicator__text">
        Build: {currentBuildStep} / {totalGroups}
      </span>
      <div className="build-step-indicator__dots">{dots}</div>
    </div>
  );
}
