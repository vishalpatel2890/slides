import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * NavigationArrows component renders prev/next buttons as overlay on main content.
 * v2-1-3 AC9: Ghost icon buttons with transparent bg, --viewer-text color, hover --viewer-hover bg
 */
interface NavigationArrowsProps {
  /** Callback for previous slide */
  onPrev: () => void;
  /** Callback for next slide */
  onNext: () => void;
}

export function NavigationArrows({
  onPrev,
  onNext,
}: NavigationArrowsProps): React.ReactElement {
  return (
    <div className="navigation-arrows">
      <button
        type="button"
        className="navigation-arrows__button navigation-arrows__button--prev"
        onClick={onPrev}
        aria-label="Previous slide"
        title="Previous slide (Left Arrow)"
      >
        <ChevronLeft className="navigation-arrows__icon" size={32} />
      </button>

      <button
        type="button"
        className="navigation-arrows__button navigation-arrows__button--next"
        onClick={onNext}
        aria-label="Next slide"
        title="Next slide (Right Arrow)"
      >
        <ChevronRight className="navigation-arrows__icon" size={32} />
      </button>
    </div>
  );
}
