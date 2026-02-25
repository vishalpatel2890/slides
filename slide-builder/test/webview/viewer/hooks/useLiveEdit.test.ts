/**
 * Tests for useLiveEdit hook.
 * v2-3-1 AC-3.1.3, AC-3.1.4, AC-3.1.5, AC-3.1.7, AC-3.1.8, AC-3.1.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveEdit, EDITABLE_TEXT_SELECTOR } from '../../../../src/webview/viewer/hooks/useLiveEdit';
import { reverseAdaptCssForShadowDom } from '../../../../src/webview/viewer/utils/reverseAdaptCssForShadowDom';
import { wrapAsHtmlDocument } from '../../../../src/webview/viewer/utils/wrapAsHtmlDocument';

// Mock state and dispatch
const mockDispatch = vi.fn();
const mockPostMessage = vi.fn();
const mockState = {
  slides: [{ number: 1, html: '<p>test</p>', fileName: 'slide-1.html', slideId: 's1', title: 'Slide 1' }],
  currentSlide: 1,
  isLoading: false,
  error: null,
  deckId: 'test-deck',
  deckName: 'Test Deck',
  sidebarVisible: true,
  fullscreenMode: null as 'view' | 'edit' | null,
  currentBuildStep: 0,
  navigatedBackward: false,
  mode: 'presentation' as const,
  saveStatus: 'idle' as const,
  manifest: null,
};

vi.mock('../../../../src/webview/viewer/context/ViewerContext', async () => {
  const actual = await vi.importActual('../../../../src/webview/viewer/context/ViewerContext');
  return {
    ...actual,
    useViewerState: () => mockState,
    useViewerDispatch: () => mockDispatch,
  };
});

vi.mock('../../../../src/webview/viewer/hooks/useVsCodeApi', () => ({
  useVsCodeApi: () => ({
    postMessage: mockPostMessage,
    getState: vi.fn(),
    setState: vi.fn(),
  }),
}));

describe('useLiveEdit', () => {
  let hostElement: HTMLDivElement;
  let shadowRoot: ShadowRoot;
  let paragraph: HTMLParagraphElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up DOM elements inside Shadow DOM to match production behavior.
    // useLiveEdit.sendSave() requires elements to be inside a ShadowRoot.
    hostElement = document.createElement('div');
    hostElement.className = 'slide-display__container';
    shadowRoot = hostElement.attachShadow({ mode: 'open' });
    paragraph = document.createElement('p');
    paragraph.textContent = 'Hello world';
    shadowRoot.appendChild(paragraph);
    document.body.appendChild(hostElement);
  });

  afterEach(() => {
    document.body.removeChild(hostElement);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('EDITABLE_TEXT_SELECTOR', () => {
    it('exports the correct selector string', () => {
      expect(EDITABLE_TEXT_SELECTOR).toBe('h1, h2, h3, h4, h5, h6, p, li, span');
    });
  });

  describe('handleElementClick', () => {
    it('sets contenteditable="true" on the element', () => {
      const { result } = renderHook(() => useLiveEdit());

      act(() => {
        result.current.handleElementClick(1, paragraph);
      });

      expect(paragraph.getAttribute('contenteditable')).toBe('true');
    });

    it('adds "editable-active" class to the element', () => {
      const { result } = renderHook(() => useLiveEdit());

      act(() => {
        result.current.handleElementClick(1, paragraph);
      });

      expect(paragraph.classList.contains('editable-active')).toBe(true);
    });

    it('calls element.focus()', () => {
      const focusSpy = vi.spyOn(paragraph, 'focus');
      const { result } = renderHook(() => useLiveEdit());

      act(() => {
        result.current.handleElementClick(1, paragraph);
      });

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('handleInput', () => {
    it('dispatches SET_SAVE_STATUS with "saving" and calls postMessage after 150ms debounce', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useLiveEdit());

      act(() => {
        result.current.handleInput(1, paragraph);
      });

      // Before debounce fires, nothing should be dispatched yet
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Advance past the 150ms debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Now the save should have fired
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SAVE_STATUS',
        saveStatus: 'saving',
      });
      // Save pipeline transforms HTML: reverse CSS adaptations + wrap as document
      const expectedHtml = wrapAsHtmlDocument(reverseAdaptCssForShadowDom(shadowRoot.innerHTML));
      // State synced so navigation preserves edits
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_SLIDE',
        slideNumber: 1,
        html: expectedHtml,
      });
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'v2-save-slide',
        slideNumber: 1,
        html: expectedHtml,
      });
    });

    it('debounces multiple rapid inputs to a single save', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useLiveEdit());

      // Fire multiple inputs rapidly
      act(() => {
        result.current.handleInput(1, paragraph);
      });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      act(() => {
        result.current.handleInput(1, paragraph);
      });
      act(() => {
        vi.advanceTimersByTime(50);
      });
      act(() => {
        result.current.handleInput(1, paragraph);
      });

      // Advance past the final debounce
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Only one save should have been sent (the last debounce)
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleBlur', () => {
    it('removes contenteditable attribute and "editable-active" class', () => {
      const { result } = renderHook(() => useLiveEdit());

      // Click to activate
      act(() => {
        result.current.handleElementClick(1, paragraph);
      });
      expect(paragraph.getAttribute('contenteditable')).toBe('true');
      expect(paragraph.classList.contains('editable-active')).toBe(true);

      // Blur to deactivate
      act(() => {
        result.current.handleBlur(paragraph);
      });

      expect(paragraph.hasAttribute('contenteditable')).toBe(false);
      expect(paragraph.classList.contains('editable-active')).toBe(false);
    });

    it('triggers final save if there is a pending input', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useLiveEdit());

      // Click to activate
      act(() => {
        result.current.handleElementClick(1, paragraph);
      });

      // Input but do NOT let the debounce timer fire
      act(() => {
        result.current.handleInput(1, paragraph);
      });

      // Blur before the timer fires — should trigger an immediate save
      act(() => {
        result.current.handleBlur(paragraph);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SAVE_STATUS',
        saveStatus: 'saving',
      });
      // Save pipeline transforms HTML: reverse CSS adaptations + wrap as document
      const expectedHtml = wrapAsHtmlDocument(reverseAdaptCssForShadowDom(shadowRoot.innerHTML));
      // State synced so navigation preserves edits
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_SLIDE',
        slideNumber: 1,
        html: expectedHtml,
      });
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'v2-save-slide',
        slideNumber: 1,
        html: expectedHtml,
      });
    });
  });

  describe('v2-save-result message listener', () => {
    it('dispatches SET_SAVE_STATUS "saved" on success, then "idle" after 2000ms', () => {
      vi.useFakeTimers();
      renderHook(() => useLiveEdit());

      // Simulate a successful save result from extension host
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { type: 'v2-save-result', success: true, fileName: 'slide-1.html' },
        }));
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SAVE_STATUS',
        saveStatus: 'saved',
      });

      // After 2000ms, should transition to idle
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SAVE_STATUS',
        saveStatus: 'idle',
      });
    });

    it('dispatches SET_SAVE_STATUS "error" on failure', () => {
      vi.useFakeTimers();
      renderHook(() => useLiveEdit());

      // Simulate a failed save result from extension host
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { type: 'v2-save-result', success: false, fileName: 'slide-1.html' },
        }));
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_SAVE_STATUS',
        saveStatus: 'error',
      });
    });
  });

  describe('cleanup', () => {
    it('removes message event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useLiveEdit());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
});
