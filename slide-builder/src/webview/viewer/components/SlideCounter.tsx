import React, { useState, useRef, useEffect } from 'react';

/**
 * SlideCounter component displays current slide position and allows jump-to-slide.
 * v2-1-3 AC7: Shows "N / Total" in 14px font, weight 600, --viewer-text color
 * v2-1-3 AC8: Click opens jump-to-slide input
 */
interface SlideCounterProps {
  /** Current slide number (1-based) */
  currentSlide: number;
  /** Total number of slides */
  totalSlides: number;
  /** Callback when user navigates to a specific slide */
  onNavigate: (slideNumber: number) => void;
}

export function SlideCounter({
  currentSlide,
  totalSlides,
  onNavigate,
}: SlideCounterProps): React.ReactElement {
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering input mode
  useEffect(() => {
    if (isInputMode && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isInputMode]);

  function handleClick() {
    if (!isInputMode) {
      setInputValue(String(currentSlide));
      setIsInputMode(true);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      const slideNum = parseInt(inputValue, 10);
      if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= totalSlides) {
        onNavigate(slideNum);
      }
      setIsInputMode(false);
    } else if (event.key === 'Escape') {
      setIsInputMode(false);
    }
  }

  function handleBlur() {
    setIsInputMode(false);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Only allow numeric input
    const value = event.target.value.replace(/\D/g, '');
    setInputValue(value);
  }

  // AC7: Accessibility attributes
  const ariaLabel = `Slide ${currentSlide} of ${totalSlides}`;

  if (isInputMode) {
    return (
      <div className="slide-counter slide-counter--input-mode">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="slide-counter__input"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          aria-label="Jump to slide number"
          maxLength={3}
        />
        <span className="slide-counter__total"> / {totalSlides}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="slide-counter"
      onClick={handleClick}
      aria-live="polite"
      aria-label={ariaLabel}
      title="Click to jump to slide"
    >
      <span className="slide-counter__current">{currentSlide}</span>
      <span className="slide-counter__separator"> / </span>
      <span className="slide-counter__total">{totalSlides}</span>
    </button>
  );
}
