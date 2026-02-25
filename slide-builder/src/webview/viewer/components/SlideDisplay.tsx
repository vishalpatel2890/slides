import React, { useRef, useEffect } from 'react';
import { useSlideScale } from '../hooks/useSlideScale';
import { useViewerState } from '../context/ViewerContext';
import { adaptCssForShadowDom } from '../utils/adaptCssForShadowDom';

/**
 * Renders a slide's HTML content via Shadow DOM for complete CSS isolation.
 * v2-1-2 AC-4: Renders via Shadow DOM on div container (no iframes)
 * v2-1-2 AC-5: Shadow DOM provides complete CSS isolation (replaces contain: content)
 * v2-1-2 AC-6: Centered with dark backdrop and 16:9 aspect ratio
 * v2-1-2 AC-7: Drop shadow for floating depth effect
 *
 * Architecture Reference: ADR-001 — innerHTML over iframes
 * Story: story-css-isolation-1 — Shadow DOM replaces CSS containment for superior isolation
 */
interface SlideDisplayProps {
  /** Full HTML content of the slide */
  slideHtml: string;
  /** Slide number for accessibility */
  slideNumber: number;
  /** Slide title for accessibility */
  slideTitle?: string;
}

export function SlideDisplay({
  slideHtml,
  slideNumber,
  slideTitle,
}: SlideDisplayProps): React.ReactElement {
  const sizerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevSlideNumberRef = useRef<number | null>(null);
  const state = useViewerState();

  // Calculate scale factor based on available content area (sizer dimensions)
  const { scale } = useSlideScale(sizerRef);

  // Set Shadow DOM innerHTML when slide content changes.
  // In live-edit mode, skip innerHTML update when the slide number is unchanged.
  // This prevents destroying the focused contenteditable element when UPDATE_SLIDE
  // syncs React state after a save. Navigation (slide number changes) always updates.
  // Shadow DOM provides complete CSS isolation, preventing slide styles from leaking.
  useEffect(() => {
    if (!containerRef.current) return;

    const isNavigation = prevSlideNumberRef.current !== slideNumber;
    const shouldSkipUpdate = (state.mode === 'live-edit' || state.fullscreenMode === 'edit') && !isNavigation;
    prevSlideNumberRef.current = slideNumber;

    if (shouldSkipUpdate) return;

    // Attach shadow root if not already attached
    if (!containerRef.current.shadowRoot) {
      containerRef.current.attachShadow({ mode: 'open' });
    }
    const shadowRoot = containerRef.current.shadowRoot!;

    // Inject animation CSS into shadow DOM since external CSS cannot cross shadow boundary.
    // These classes are applied by useAnimations for build step reveal in fullscreen mode.
    const animationStyles = `
      <style data-shadow-animations>
        .animation-hidden {
          opacity: 0 !important;
          visibility: hidden !important;
        }
        .animation-visible {
          opacity: 1 !important;
          visibility: visible !important;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .animation-instant {
          transition: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .animation-visible {
            transition: none !important;
          }
        }
      </style>
    `;
    // Adapt slide CSS for Shadow DOM: remap :root→:host and body→.slide selectors
    // so CSS custom properties and body-level styles work inside the shadow tree.
    shadowRoot.innerHTML = animationStyles + adaptCssForShadowDom(slideHtml);
    // Strip editing artifacts that may have been saved to disk (v2-3-1).
    // Without this, elements saved with contenteditable="true" would be
    // editable on load even without entering edit mode.
    shadowRoot.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
    });
    shadowRoot.querySelectorAll('.editable-active, .editable-hover').forEach(el => {
      el.classList.remove('editable-active', 'editable-hover');
    });
  }, [slideHtml, slideNumber, state.mode, state.fullscreenMode]);

  // Compute exact pixel dimensions for the wrapper
  const visualWidth = 1920 * scale;
  const visualHeight = 1080 * scale;

  return (
    <div className="slide-display" role="region" aria-label={`Slide ${slideNumber}: ${slideTitle || ''}`}>
      {/* Invisible sizer measures available content area (inside padding) */}
      <div ref={sizerRef} className="slide-display__sizer" />
      {/* Wrapper sized by JS — flexbox on parent centers it */}
      <div
        className="slide-display__wrapper"
        style={{ width: visualWidth, height: visualHeight }}
      >
        <div
          ref={containerRef}
          className="slide-display__container"
          onMouseDown={(e) => {
            // In presentation/view mode, prevent focus from entering Shadow DOM
            // so keyboard shortcuts (F, arrows, space, etc.) continue working
            // after clicking on slide content. In edit modes, allow normal focus
            // for contenteditable text editing.
            if (state.mode !== 'live-edit' && state.fullscreenMode !== 'edit') {
              e.preventDefault();
            }
          }}
          style={{
            width: 1920,
            height: 1080,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          aria-live="polite"
        />
      </div>
    </div>
  );
}
