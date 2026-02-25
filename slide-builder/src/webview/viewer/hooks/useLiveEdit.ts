import { useRef, useCallback, useEffect } from 'react';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import { useVsCodeApi } from './useVsCodeApi';
import { reverseAdaptCssForShadowDom } from '../utils/reverseAdaptCssForShadowDom';
import { wrapAsHtmlDocument } from '../utils/wrapAsHtmlDocument';
import type { ViewerV2ExtensionMessage } from '../../../shared/types';

/**
 * Text element selector for editable elements.
 * Only standard text elements are editable — images, SVGs, containers are excluded.
 * v2-3-1 AC-3.1.2, AC-3.1.11
 */
export const EDITABLE_TEXT_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, span';

/** Debounce delay in milliseconds (FR33) */
const DEBOUNCE_MS = 150;

/** Duration to show "Saved" status before returning to idle */
const SAVED_DISPLAY_MS = 2000;

/**
 * Return type for the useLiveEdit hook.
 */
export interface UseLiveEditReturn {
  /** Handle click on a text element to begin editing */
  handleElementClick: (slideNumber: number, element: HTMLElement) => void;
  /** Handle input event on contenteditable element */
  handleInput: (slideNumber: number, element: HTMLElement) => void;
  /** Handle blur (click outside or focus loss) on editing element */
  handleBlur: (element: HTMLElement) => void;
  /** Whether any element is currently being edited */
  isEditing: boolean;
}

/**
 * Hook for managing inline text editing with debounced disk persistence.
 * Implements contenteditable lifecycle + 150ms debounced save via v2-save-slide messages.
 *
 * v2-3-1 AC-3.1.3: Click text → contenteditable with blue border
 * v2-3-1 AC-3.1.4: Type changes → live DOM update
 * v2-3-1 AC-3.1.5: 150ms debounce → v2-save-slide with full slide HTML
 * v2-3-1 AC-3.1.10: Click outside / Escape → exit editing, final save
 *
 * Architecture Reference: Live Edit Save Pattern (notes/architecture/architecture.md)
 */
export function useLiveEdit(): UseLiveEditReturn {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();

  // Refs to avoid stale closures (pattern from useAnimations)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const pendingSaveRef = useRef(false);

  /**
   * Clear the debounce save timer.
   */
  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  /**
   * Clear the saved display timer.
   */
  const clearSavedTimer = useCallback(() => {
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
  }, []);

  /**
   * Send save message to extension host.
   * Updated for Shadow DOM: element.getRootNode() returns the ShadowRoot when inside shadow DOM.
   */
  const sendSave = useCallback((slideNumber: number, element: HTMLElement) => {
    // Get the root node - will be ShadowRoot if element is inside shadow DOM
    const rootNode = element.getRootNode();
    if (!(rootNode instanceof ShadowRoot)) {
      console.warn('[useLiveEdit] Element is not inside Shadow DOM, skipping save');
      return;
    }

    // Create a temporary container to hold cloned content for serialization.
    // We clone all children of the shadow root, not the host element.
    const clone = document.createElement('div');
    Array.from(rootNode.childNodes).forEach(child => {
      clone.appendChild(child.cloneNode(true));
    });

    // Strip editing artifacts before saving.
    // Without this, contenteditable="true" and CSS classes like
    // .editable-active would be persisted to disk and cause elements
    // to be editable on next load without entering edit mode.
    clone.querySelectorAll('[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
    });
    clone.querySelectorAll('.editable-active, .editable-hover').forEach(el => {
      el.classList.remove('editable-active', 'editable-hover');
    });

    dispatch({ type: 'SET_SAVE_STATUS', saveStatus: 'saving' });
    pendingSaveRef.current = false;

    // Reverse Shadow DOM CSS adaptations and reconstruct proper HTML document
    // structure before saving. Without this, saved files contain :host selectors
    // and lack <!DOCTYPE html> structure, breaking PresentServer rendering.
    const rawHtml = clone.innerHTML;
    const restoredCss = reverseAdaptCssForShadowDom(rawHtml);
    const fullDocument = wrapAsHtmlDocument(restoredCss);

    // Sync React state so navigation preserves edits.
    // The extension host suppresses the file watcher after save to prevent
    // self-triggered refresh, which means v2-slide-updated is never sent back.
    // Without this dispatch, state.slides[] retains the original HTML and
    // navigating away and back would revert the visual edit.
    dispatch({ type: 'UPDATE_SLIDE', slideNumber, html: fullDocument });

    postMessage({
      type: 'v2-save-slide',
      slideNumber,
      html: fullDocument,
    });
  }, [dispatch, postMessage]);

  /**
   * Handle click on a text element to begin editing.
   * AC-3.1.3: Set contenteditable, apply active class, focus.
   */
  const handleElementClick = useCallback((slideNumber: number, element: HTMLElement) => {
    // Deactivate previous element if different
    if (activeElementRef.current && activeElementRef.current !== element) {
      activeElementRef.current.removeAttribute('contenteditable');
      activeElementRef.current.classList.remove('editable-active');

      // Fire final save for previous element if pending
      if (pendingSaveRef.current) {
        clearSaveTimer();
        sendSave(slideNumber, activeElementRef.current);
      }
    }

    // Activate new element
    element.setAttribute('contenteditable', 'true');
    element.classList.add('editable-active');
    element.focus();
    activeElementRef.current = element;
  }, [clearSaveTimer, sendSave]);

  /**
   * Handle input event on contenteditable element.
   * AC-3.1.5: Debounce at 150ms, then send v2-save-slide.
   */
  const handleInput = useCallback((slideNumber: number, element: HTMLElement) => {
    pendingSaveRef.current = true;
    clearSaveTimer();

    saveTimerRef.current = setTimeout(() => {
      sendSave(slideNumber, element);
    }, DEBOUNCE_MS);
  }, [clearSaveTimer, sendSave]);

  /**
   * Handle blur on editing element.
   * AC-3.1.10: Remove contenteditable, fire final save if pending.
   */
  const handleBlur = useCallback((element: HTMLElement) => {
    element.removeAttribute('contenteditable');
    element.classList.remove('editable-active');

    // Fire final save if there's a pending debounce
    if (pendingSaveRef.current && state.currentSlide) {
      clearSaveTimer();
      sendSave(state.currentSlide, element);
    }

    if (activeElementRef.current === element) {
      activeElementRef.current = null;
    }
  }, [state.currentSlide, clearSaveTimer, sendSave]);

  /**
   * Listen for v2-save-result messages from extension host.
   * AC-3.1.7: success → "Saved ✓" for 2s, then idle.
   * AC-3.1.8: failure → "Save failed" in red.
   */
  useEffect(() => {
    function handleMessage(event: MessageEvent<ViewerV2ExtensionMessage>) {
      const message = event.data;
      if (!message || message.type !== 'v2-save-result') return;

      if (message.success) {
        dispatch({ type: 'SET_SAVE_STATUS', saveStatus: 'saved' });
        clearSavedTimer();
        savedTimerRef.current = setTimeout(() => {
          dispatch({ type: 'SET_SAVE_STATUS', saveStatus: 'idle' });
        }, SAVED_DISPLAY_MS);
      } else {
        dispatch({ type: 'SET_SAVE_STATUS', saveStatus: 'error' });
        // Auto-clear error after 5s
        clearSavedTimer();
        savedTimerRef.current = setTimeout(() => {
          dispatch({ type: 'SET_SAVE_STATUS', saveStatus: 'idle' });
        }, 5000);
      }
    }

    window.addEventListener('message', handleMessage as EventListener);
    return () => window.removeEventListener('message', handleMessage as EventListener);
  }, [dispatch, clearSavedTimer]);

  /**
   * Clean up active editing when mode changes away from live-edit.
   */
  useEffect(() => {
    if (state.mode !== 'live-edit' && state.fullscreenMode !== 'edit' && activeElementRef.current) {
      activeElementRef.current.removeAttribute('contenteditable');
      activeElementRef.current.classList.remove('editable-active');
      activeElementRef.current = null;
      clearSaveTimer();
    }
  }, [state.mode, state.fullscreenMode, clearSaveTimer]);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      clearSaveTimer();
      clearSavedTimer();
    };
  }, [clearSaveTimer, clearSavedTimer]);

  return {
    handleElementClick,
    handleInput,
    handleBlur,
    isEditing: activeElementRef.current !== null,
  };
}
