/**
 * useVSCodeApi - Hook for communicating with the VS Code extension host.
 *
 * Story Reference: 18-3 Task 4 - Create useVSCodeApi hook
 * Story Reference: 18-4 Task 5 - Implement edit debouncing
 * Architecture Reference: notes/architecture/architecture.md#Message Protocol
 *
 * AC-18.3.4: Hook provides postMessage() and onMessage() functions
 * AC-18.4.7: Edit debouncing at 150ms — only final value written
 */

import { useCallback, useEffect, useRef } from 'react';
import type { WebviewMessage, ExtensionMessage } from '../../../shared/types';

// =============================================================================
// Constants
// =============================================================================

/**
 * Debounce delay for UI edits (AC-18.4.7).
 * Prevents excessive updates when user types rapidly.
 */
const EDIT_DEBOUNCE_MS = 150;

// =============================================================================
// VS Code API Type (acquired from window in webview context)
// =============================================================================

interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
}

// Declare the VS Code API acquisition function
declare function acquireVsCodeApi(): VSCodeAPI;

// =============================================================================
// Singleton VS Code API Instance
// AC-18.3.2: index.tsx acquires VS Code API via acquireVsCodeApi() as singleton
// =============================================================================

let vscodeApi: VSCodeAPI | null = null;

/**
 * Get the VS Code API singleton.
 * Acquires the API on first call and caches it.
 */
function getVSCodeApi(): VSCodeAPI {
  if (vscodeApi === null) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

// Export for direct access if needed (e.g., in index.tsx)
export { getVSCodeApi };

// =============================================================================
// Debounce Utility
// =============================================================================

/**
 * Map key for per-field debouncing: "slideNumber:field"
 */
type DebounceKey = string;

/**
 * Creates a debounce key for a slide field.
 * Ensures debouncing is per-field, not global (AC-18.4.7).
 */
function createDebounceKey(slideNumber: number, field: string): DebounceKey {
  return `${slideNumber}:${field}`;
}

// =============================================================================
// Hook Return Type
// =============================================================================

interface UseVSCodeApiReturn {
  /**
   * Send a typed message to the extension host.
   */
  postMessage: (message: WebviewMessage) => void;
  /**
   * Send a debounced edit-slide message (AC-18.4.7).
   * Debounces at 150ms per-field to avoid excessive updates during rapid typing.
   *
   * @param slideNumber - 1-indexed slide number
   * @param field - Field name being edited (e.g., 'intent', 'template')
   * @param value - New value for the field
   */
  postEditSlide: (slideNumber: number, field: string, value: unknown) => void;
  /**
   * Subscribe to messages from the extension host.
   * Returns a cleanup function to remove the listener.
   */
  onMessage: (handler: (message: ExtensionMessage) => void) => () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for VS Code webview message passing.
 *
 * @example
 * ```tsx
 * const { postMessage, onMessage } = useVSCodeApi();
 *
 * // Send a message
 * postMessage({ type: 'ready' });
 *
 * // Subscribe to messages
 * useEffect(() => {
 *   return onMessage((msg) => {
 *     if (msg.type === 'plan-updated') {
 *       dispatch({ type: 'SET_PLAN', plan: msg.plan });
 *     }
 *   });
 * }, [onMessage]);
 * ```
 */
export function useVSCodeApi(): UseVSCodeApiReturn {
  // Store handlers in a ref to avoid recreating callbacks
  const handlersRef = useRef<Set<(message: ExtensionMessage) => void>>(new Set());

  // Store debounce timers per field (key: "slideNumber:field")
  // This ensures debouncing is per-field, not global (AC-18.4.7 Task 5.3)
  const debounceTimersRef = useRef<Map<DebounceKey, ReturnType<typeof setTimeout>>>(new Map());

  // Set up the global message listener once
  useEffect(() => {
    function handleMessage(event: MessageEvent<ExtensionMessage>) {
      const message = event.data;
      handlersRef.current.forEach((handler) => handler(message));
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      // Clean up all debounce timers on unmount
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer));
      debounceTimersRef.current.clear();
    };
  }, []);

  // Memoized postMessage function
  const postMessage = useCallback((message: WebviewMessage) => {
    getVSCodeApi().postMessage(message);
  }, []);

  // Debounced edit-slide message (AC-18.4.7)
  // Only final value is sent after 150ms of no changes
  const postEditSlide = useCallback(
    (slideNumber: number, field: string, value: unknown) => {
      const key = createDebounceKey(slideNumber, field);

      // Clear existing timer for this field
      const existingTimer = debounceTimersRef.current.get(key);
      if (existingTimer !== undefined) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        getVSCodeApi().postMessage({
          type: 'edit-slide',
          slideNumber,
          field,
          value,
        });
        debounceTimersRef.current.delete(key);
      }, EDIT_DEBOUNCE_MS);

      debounceTimersRef.current.set(key, timer);
    },
    []
  );

  // Memoized onMessage subscription function
  const onMessage = useCallback(
    (handler: (message: ExtensionMessage) => void): (() => void) => {
      handlersRef.current.add(handler);

      // Return cleanup function
      return () => {
        handlersRef.current.delete(handler);
      };
    },
    []
  );

  return { postMessage, postEditSlide, onMessage };
}
