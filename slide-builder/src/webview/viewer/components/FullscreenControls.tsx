import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BuildStepIndicator } from './BuildStepIndicator';

/**
 * Navigation controls overlay for fullscreen presentation mode.
 * Shows prev/next arrows and slide counter with fade visibility.
 *
 * v2-2-2 AC-5: Mouse movement shows controls with fade-in
 * v2-2-2 AC-6: Controls fade out after 3 seconds of no movement
 * v2-2-3 AC-2,4,9,10: BuildStepIndicator in fullscreen mode
 */

interface FullscreenControlsProps {
  /** Whether controls should be visible */
  visible: boolean;
  /** Handler for previous slide */
  onPrev: () => void;
  /** Handler for next slide */
  onNext: () => void;
  /** Current slide number (1-based) */
  currentSlide: number;
  /** Total number of slides */
  totalSlides: number;
  /** Current animation build step (0 = nothing revealed) */
  currentBuildStep?: number;
  /** Total number of animation groups */
  totalGroups?: number;
  /** Whether current slide has animations */
  hasAnimations?: boolean;
}

export function FullscreenControls({
  visible,
  onPrev,
  onNext,
  currentSlide,
  totalSlides,
  currentBuildStep = 0,
  totalGroups = 0,
  hasAnimations = false,
}: FullscreenControlsProps): React.ReactElement {
  return (
    <div
      className={`fullscreen-controls ${visible ? 'fullscreen-controls--visible' : ''}`}
      aria-hidden={!visible}
    >
      {/* Previous button - left edge */}
      <button
        type="button"
        className="fullscreen-controls__button fullscreen-controls__button--prev"
        onClick={onPrev}
        aria-label="Previous slide"
        tabIndex={visible ? 0 : -1}
      >
        <ChevronLeft size={48} />
      </button>

      {/* v2-2-3: Build step indicator - bottom left (only when slide has animations) */}
      {hasAnimations && (
        <BuildStepIndicator
          currentBuildStep={currentBuildStep}
          totalGroups={totalGroups}
          visible={true}
          variant="fullscreen"
        />
      )}

      {/* Slide counter - bottom center */}
      <div className="fullscreen-controls__counter">
        <span className="fullscreen-controls__current">{currentSlide}</span>
        <span className="fullscreen-controls__separator"> / </span>
        <span className="fullscreen-controls__total">{totalSlides}</span>
      </div>

      {/* Next button - right edge */}
      <button
        type="button"
        className="fullscreen-controls__button fullscreen-controls__button--next"
        onClick={onNext}
        aria-label="Next slide"
        tabIndex={visible ? 0 : -1}
      >
        <ChevronRight size={48} />
      </button>
    </div>
  );
}
