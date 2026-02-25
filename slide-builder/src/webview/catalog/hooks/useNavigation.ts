/**
 * useNavigation - Hook for catalog navigation with VS Code state persistence.
 *
 * Story Reference: cv-1-2 Task 5 — useNavigation hook
 *
 * AC-4: Navigation stack for drill-down
 * AC-7: Persist active tab across panel hide/show
 */

import { useEffect, useCallback } from 'react';
import { getVSCodeApi } from '../../shared/hooks/useVSCodeApi';
import { useCatalog } from '../context/CatalogContext';
import type { CatalogTab, NavigationEntry } from '../../../shared/types';

// =============================================================================
// Persisted State Shape
// =============================================================================

interface PersistedCatalogState {
  activeTab: CatalogTab;
  navigationStack: NavigationEntry[];
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useNavigation() {
  const { state, dispatch } = useCatalog();

  // Restore persisted state on mount
  useEffect(() => {
    const vscode = getVSCodeApi();
    const persisted = vscode.getState<PersistedCatalogState>();
    if (persisted?.activeTab) {
      dispatch({ type: 'SET_TAB', tab: persisted.activeTab });
    }
  }, [dispatch]);

  // Persist state changes to VS Code webview state
  useEffect(() => {
    const vscode = getVSCodeApi();
    vscode.setState<PersistedCatalogState>({
      activeTab: state.activeTab,
      navigationStack: state.navigationStack,
    });
  }, [state.activeTab, state.navigationStack]);

  const push = useCallback(
    (deckId: string) => {
      dispatch({ type: 'NAVIGATE_TO_DECK', deckId });
    },
    [dispatch],
  );

  const pop = useCallback(() => {
    dispatch({ type: 'NAVIGATE_BACK' });
  }, [dispatch]);

  const reset = useCallback(
    (tab: CatalogTab) => {
      dispatch({ type: 'SET_TAB', tab });
    },
    [dispatch],
  );

  return {
    activeTab: state.activeTab,
    navigationStack: state.navigationStack,
    canGoBack: state.navigationStack.length > 1,
    currentEntry: state.navigationStack[state.navigationStack.length - 1],
    push,
    pop,
    reset,
  };
}
