/**
 * Tests for useNavigation hook.
 *
 * Story Reference: cv-1-2 Task 5 — useNavigation hook
 * AC-4: Navigation stack push/pop/reset
 * AC-7: VS Code state persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { CatalogProvider } from '../../src/webview/catalog/context/CatalogContext';
import { useNavigation } from '../../src/webview/catalog/hooks/useNavigation';

// =============================================================================
// VS Code API Mock
// =============================================================================

const mockState: Record<string, unknown> = {};

const mockVSCodeApi = {
  postMessage: vi.fn(),
  getState: vi.fn(() => mockState['webviewState']),
  setState: vi.fn((state: unknown) => {
    mockState['webviewState'] = state;
  }),
};

beforeEach(() => {
  vi.stubGlobal('acquireVsCodeApi', () => mockVSCodeApi);
  mockVSCodeApi.getState.mockReturnValue(undefined);
  mockVSCodeApi.setState.mockClear();
  mockVSCodeApi.postMessage.mockClear();
  mockState['webviewState'] = undefined;

  // Reset the singleton so acquireVsCodeApi is called again
  // We need to invalidate the cached vscodeApi in useVSCodeApi module
  vi.resetModules();
});

// =============================================================================
// Helper
// =============================================================================

function createWrapper(overrides?: Parameters<typeof CatalogProvider>[0]['initialOverrides']) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <CatalogProvider initialOverrides={overrides}>{children}</CatalogProvider>;
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('useNavigation', () => {
  it('returns activeTab from context', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });
    expect(result.current.activeTab).toBe('decks');
  });

  it('returns navigationStack from context', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });
    expect(result.current.navigationStack).toHaveLength(1);
    expect(result.current.navigationStack[0].type).toBe('tab-root');
  });

  it('canGoBack is false at root', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });
    expect(result.current.canGoBack).toBe(false);
  });

  it('canGoBack is true when drilled in', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper({
        navigationStack: [
          { id: 'decks', label: 'Decks', type: 'tab-root' },
          { id: 'd1', label: 'My Deck', type: 'deck-detail' },
        ],
      }),
    });
    expect(result.current.canGoBack).toBe(true);
  });

  it('currentEntry returns last stack entry', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });
    expect(result.current.currentEntry.label).toBe('Decks');
  });

  it('reset changes tab and resets navigation', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.reset('templates');
    });

    expect(result.current.activeTab).toBe('templates');
    expect(result.current.navigationStack).toHaveLength(1);
    expect(result.current.currentEntry.label).toBe('Templates');
  });

  it('pop navigates back', () => {
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper({
        navigationStack: [
          { id: 'decks', label: 'Decks', type: 'tab-root' },
          { id: 'd1', label: 'My Deck', type: 'deck-detail' },
        ],
      }),
    });

    act(() => {
      result.current.pop();
    });

    expect(result.current.navigationStack).toHaveLength(1);
    expect(result.current.canGoBack).toBe(false);
  });

  it('persists state via VS Code setState', () => {
    renderHook(() => useNavigation(), {
      wrapper: createWrapper(),
    });

    // setState should have been called with initial state
    expect(mockVSCodeApi.setState).toHaveBeenCalled();
    const lastCall = mockVSCodeApi.setState.mock.calls[mockVSCodeApi.setState.mock.calls.length - 1][0];
    expect(lastCall).toHaveProperty('activeTab', 'decks');
    expect(lastCall).toHaveProperty('navigationStack');
  });
});
