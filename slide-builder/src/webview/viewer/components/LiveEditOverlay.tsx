import { useEffect, useRef, useCallback } from 'react';
import { useViewerState } from '../context/ViewerContext';
import { EDITABLE_TEXT_SELECTOR, type UseLiveEditReturn } from '../hooks/useLiveEdit';

/**
 * Props for LiveEditOverlay component.
 */
interface LiveEditOverlayProps {
  /** Live edit hook handlers */
  liveEdit: UseLiveEditReturn;
  /** Current slide number (1-based) */
  slideNumber: number;
}

/**
 * Manages edit mode interactions on the slide container.
 * Attaches hover/click listeners on text elements within .slide-display__container.
 *
 * v2-3-1 AC-3.1.2: Hover text → dashed underline (.editable-hover)
 * v2-3-1 AC-3.1.3: Click text → contenteditable with blue border (.editable-active)
 * v2-3-1 AC-3.1.11: Non-text elements are not editable
 *
 * This component renders nothing visible — it only manages DOM event listeners.
 */
export function LiveEditOverlay({
  liveEdit,
  slideNumber,
}: LiveEditOverlayProps): null {
  const state = useViewerState();
  const isEditMode = state.mode === 'live-edit' || state.fullscreenMode === 'edit';
  const hoverTargetRef = useRef<HTMLElement | null>(null);

  /**
   * Check if an element is an editable text element.
   * AC-3.1.11: Only h1-h6, p, li, span are editable.
   */
  const isEditableElement = useCallback((target: HTMLElement): boolean => {
    return target.matches(EDITABLE_TEXT_SELECTOR);
  }, []);

  /**
   * Find the editable text element from the event target.
   * Walks up to find the nearest matching text element.
   * Since content is inside Shadow DOM, we just check for matching selector.
   */
  const findEditableElement = useCallback((target: HTMLElement): HTMLElement | null => {
    // Check the target itself
    if (isEditableElement(target)) return target;
    // Check closest matching ancestor
    return target.closest<HTMLElement>(EDITABLE_TEXT_SELECTOR);
  }, [isEditableElement]);

  useEffect(() => {
    if (!isEditMode) return;

    const container = document.querySelector('.slide-display__container');
    if (!container) return;

    // Events from Shadow DOM are retargeted, so we need to attach listeners
    // to the shadow root to receive events from elements inside it.
    const shadowRoot = container.shadowRoot;
    if (!shadowRoot) return;

    /**
     * Handle mouseover — add hover class to editable text elements.
     */
    function handleMouseOver(event: Event) {
      const target = event.target as HTMLElement;
      const editable = findEditableElement(target);

      if (editable && editable !== hoverTargetRef.current) {
        // Remove hover from previous target
        if (hoverTargetRef.current) {
          hoverTargetRef.current.classList.remove('editable-hover');
        }
        editable.classList.add('editable-hover');
        hoverTargetRef.current = editable;
      }
    }

    /**
     * Handle mouseout — remove hover class.
     */
    function handleMouseOut(event: Event) {
      const target = event.target as HTMLElement;
      const editable = findEditableElement(target);

      if (editable && editable === hoverTargetRef.current) {
        editable.classList.remove('editable-hover');
        hoverTargetRef.current = null;
      }
    }

    /**
     * Handle click — activate contenteditable on the text element.
     */
    function handleClick(event: Event) {
      const target = event.target as HTMLElement;

      // If already editing this element, don't re-activate
      if (target.isContentEditable) return;

      const editable = findEditableElement(target);
      if (editable) {
        liveEdit.handleElementClick(slideNumber, editable);
      }
    }

    /**
     * Handle input — debounced save on typing.
     */
    function handleInputEvent(event: Event) {
      const target = event.target as HTMLElement;
      if (target.isContentEditable) {
        liveEdit.handleInput(slideNumber, target);
      }
    }

    /**
     * Handle focusout (blur) — exit editing for the element.
     */
    function handleFocusOut(event: Event) {
      const target = event.target as HTMLElement;
      if (target.getAttribute('contenteditable') === 'true') {
        liveEdit.handleBlur(target);
      }
    }

    shadowRoot.addEventListener('mouseover', handleMouseOver);
    shadowRoot.addEventListener('mouseout', handleMouseOut);
    shadowRoot.addEventListener('click', handleClick);
    shadowRoot.addEventListener('input', handleInputEvent);
    shadowRoot.addEventListener('focusout', handleFocusOut);

    return () => {
      shadowRoot.removeEventListener('mouseover', handleMouseOver);
      shadowRoot.removeEventListener('mouseout', handleMouseOut);
      shadowRoot.removeEventListener('click', handleClick);
      shadowRoot.removeEventListener('input', handleInputEvent);
      shadowRoot.removeEventListener('focusout', handleFocusOut);

      // Clean up hover class on unmount
      if (hoverTargetRef.current) {
        hoverTargetRef.current.classList.remove('editable-hover');
        hoverTargetRef.current = null;
      }
    };
  }, [isEditMode, slideNumber, liveEdit, findEditableElement]);

  // This component renders nothing — it only manages event listeners
  return null;
}
