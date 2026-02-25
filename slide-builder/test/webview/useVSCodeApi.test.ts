/**
 * Tests for useVSCodeApi hook.
 *
 * Story Reference: 18-3 Task 10.1 - Create test for useVSCodeApi
 * AC-18.3.4: Hook provides postMessage() and onMessage() functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVSCodeApi, getVSCodeApi } from '../../src/webview/plan/hooks/useVSCodeApi';
import type { ExtensionMessage } from '../../src/shared/types';

// Mock acquireVsCodeApi for browser context
const mockPostMessage = vi.fn();
const mockVscodeApi = {
  postMessage: mockPostMessage,
  getState: vi.fn(),
  setState: vi.fn(),
};

// Define acquireVsCodeApi on global object
declare global {
  function acquireVsCodeApi(): typeof mockVscodeApi;
}

(globalThis as { acquireVsCodeApi?: () => typeof mockVscodeApi }).acquireVsCodeApi = () => mockVscodeApi;

describe('useVSCodeApi', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getVSCodeApi', () => {
    it('should return the VS Code API singleton', () => {
      const api1 = getVSCodeApi();
      const api2 = getVSCodeApi();
      expect(api1).toBe(api2);
    });
  });

  describe('postMessage', () => {
    it('should call vscode.postMessage with the given message', () => {
      const { result } = renderHook(() => useVSCodeApi());

      act(() => {
        result.current.postMessage({ type: 'ready' });
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'ready' });
    });

    it('should call vscode.postMessage for edit-slide message', () => {
      const { result } = renderHook(() => useVSCodeApi());

      act(() => {
        result.current.postMessage({
          type: 'edit-slide',
          slideNumber: 1,
          field: 'intent',
          value: 'New intent',
        });
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 1,
        field: 'intent',
        value: 'New intent',
      });
    });

    it('should call vscode.postMessage for build-all message', () => {
      const { result } = renderHook(() => useVSCodeApi());

      act(() => {
        result.current.postMessage({ type: 'build-all' });
      });

      expect(mockPostMessage).toHaveBeenCalledWith({ type: 'build-all' });
    });
  });

  describe('onMessage', () => {
    it('should subscribe to window message events', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useVSCodeApi());

      const cleanup = result.current.onMessage(handler);

      // Simulate a message from the extension
      const message: ExtensionMessage = {
        type: 'plan-updated',
        plan: {
          deck_name: 'Test Deck',
          created: '2026-02-15',
          last_modified: '2026-02-15',
          audience: { description: 'Test', knowledge_level: 'intermediate', priorities: [] },
          purpose: 'Test',
          desired_outcome: 'Test',
          key_message: 'Test',
          storyline: { opening_hook: '', tension: '', resolution: '', call_to_action: '' },
          recurring_themes: [],
          agenda_sections: [],
          slides: [],
        },
        validationWarnings: [],
      };

      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: message }));
      });

      expect(handler).toHaveBeenCalledWith(message);

      // Cleanup
      cleanup();
    });

    it('should remove listener on cleanup', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useVSCodeApi());

      const cleanup = result.current.onMessage(handler);
      cleanup();

      // Message after cleanup should not trigger handler
      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: { type: 'plan-updated' } }));
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const { result } = renderHook(() => useVSCodeApi());

      const cleanup1 = result.current.onMessage(handler1);
      const cleanup2 = result.current.onMessage(handler2);

      const message: ExtensionMessage = {
        type: 'templates-loaded',
        templates: [],
      };

      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: message }));
      });

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);

      cleanup1();
      cleanup2();
    });

    it('should handle theme-loaded messages', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useVSCodeApi());

      result.current.onMessage(handler);

      const message: ExtensionMessage = {
        type: 'theme-loaded',
        theme: { colors: { primary: '#3a61ff' } },
      };

      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: message }));
      });

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle confidence-scores messages', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useVSCodeApi());

      result.current.onMessage(handler);

      const message: ExtensionMessage = {
        type: 'confidence-scores',
        scores: {
          1: [{ templateId: 't1', templateName: 'Title', score: 85, tier: 'high' }],
        },
      };

      act(() => {
        window.dispatchEvent(new MessageEvent('message', { data: message }));
      });

      expect(handler).toHaveBeenCalledWith(message);
    });
  });

  describe('postEditSlide (AC-18.4.7)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce edit-slide messages at 150ms', async () => {
      const { result } = renderHook(() => useVSCodeApi());

      // Send multiple rapid edits
      act(() => {
        result.current.postEditSlide(1, 'intent', 'a');
        result.current.postEditSlide(1, 'intent', 'ab');
        result.current.postEditSlide(1, 'intent', 'abc');
      });

      // Before debounce time elapses, no message should be sent
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Advance time by 150ms
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Only the final value should be sent
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 1,
        field: 'intent',
        value: 'abc',
      });
    });

    it('should debounce per-field, not globally (Task 5.3)', async () => {
      const { result } = renderHook(() => useVSCodeApi());

      // Send edits to different fields
      act(() => {
        result.current.postEditSlide(1, 'intent', 'Intent value');
        result.current.postEditSlide(1, 'template', 'Template value');
      });

      // Before debounce time elapses, no message should be sent
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Advance time by 150ms
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Both fields should have their messages sent (one each)
      expect(mockPostMessage).toHaveBeenCalledTimes(2);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 1,
        field: 'intent',
        value: 'Intent value',
      });
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 1,
        field: 'template',
        value: 'Template value',
      });
    });

    it('should debounce per-slide and per-field combination', async () => {
      const { result } = renderHook(() => useVSCodeApi());

      // Edit same field on different slides
      act(() => {
        result.current.postEditSlide(1, 'intent', 'Slide 1 intent');
        result.current.postEditSlide(2, 'intent', 'Slide 2 intent');
      });

      // Advance time by 150ms
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Both slides should have their messages sent (debounced separately)
      expect(mockPostMessage).toHaveBeenCalledTimes(2);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 1,
        field: 'intent',
        value: 'Slide 1 intent',
      });
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 2,
        field: 'intent',
        value: 'Slide 2 intent',
      });
    });

    it('should cancel pending edits when new edit arrives for same field', async () => {
      const { result } = renderHook(() => useVSCodeApi());

      // Send first edit
      act(() => {
        result.current.postEditSlide(1, 'intent', 'First');
      });

      // Advance time by 100ms (not quite 150ms)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // No message yet
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Send second edit to same field (resets timer)
      act(() => {
        result.current.postEditSlide(1, 'intent', 'Second');
      });

      // Advance time by 100ms again (200ms total from first, 100ms from second)
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Still no message (second edit reset the timer)
      expect(mockPostMessage).not.toHaveBeenCalled();

      // Advance time by another 50ms (150ms from second edit)
      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Now only the second value should be sent
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith({
        type: 'edit-slide',
        slideNumber: 1,
        field: 'intent',
        value: 'Second',
      });
    });
  });
});
