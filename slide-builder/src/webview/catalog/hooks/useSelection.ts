/**
 * useSelection - Hook for multi-select interactions in catalog grids.
 *
 * Story Reference: cv-5-4 Task 2 — Selection interaction logic
 * AC-27: Shift+click or Ctrl/Cmd+click for multi-select
 * AC-32: Escape key clears selection
 * AC-36: Selection clears on tab switch, navigation
 */

import { useCallback, useEffect } from 'react';
import { useCatalog, useSelectedIds, useLastSelectedId, useSelectionCount } from '../context/CatalogContext';

export interface UseSelectionOptions {
  /** Array of all item IDs in display order (for range selection) */
  allIds: string[];
}

export interface UseSelectionResult {
  /** Set of currently selected IDs */
  selectedIds: Set<string>;
  /** Check if a specific item is selected */
  isSelected: (id: string) => boolean;
  /**
   * Handle click on an item with modifier key detection.
   * - Plain click: Select single item (clear previous)
   * - Ctrl/Cmd+click: Toggle item selection
   * - Shift+click: Select range from last selected to clicked
   */
  handleItemClick: (id: string, event: React.MouseEvent) => void;
  /** Clear all selected items */
  clearSelection: () => void;
  /** Number of items currently selected */
  selectionCount: number;
  /** Whether any items are selected */
  hasSelection: boolean;
}

/**
 * Hook for managing multi-select interactions in catalog grids.
 *
 * @param options.allIds - Array of all item IDs in display order for range selection
 * @returns Selection state and handlers
 *
 * @example
 * ```tsx
 * const { isSelected, handleItemClick, selectionCount } = useSelection({
 *   allIds: decks.map(d => d.id)
 * });
 *
 * // In DeckCard
 * <div
 *   onClick={(e) => handleItemClick(deck.id, e)}
 *   className={isSelected(deck.id) ? 'selected' : ''}
 * />
 * ```
 */
export function useSelection({ allIds }: UseSelectionOptions): UseSelectionResult {
  const { dispatch } = useCatalog();
  const selectedIds = useSelectedIds();
  const lastSelectedId = useLastSelectedId();
  const selectionCount = useSelectionCount();

  // AC-27: Check if an item is selected
  const isSelected = useCallback(
    (id: string): boolean => selectedIds.has(id),
    [selectedIds]
  );

  // AC-27: Handle click with modifier key detection
  const handleItemClick = useCallback(
    (id: string, event: React.MouseEvent): void => {
      // Shift+click: Select range from last selected to clicked
      if (event.shiftKey && lastSelectedId && lastSelectedId !== id) {
        dispatch({
          type: 'SELECT_RANGE',
          fromId: lastSelectedId,
          toId: id,
          allIds,
        });
        return;
      }

      // Ctrl+click (Windows/Linux) or Cmd+click (Mac): Toggle selection
      if (event.ctrlKey || event.metaKey) {
        dispatch({ type: 'TOGGLE_ITEM', id });
        return;
      }

      // Plain click: Select single item (clear previous selection)
      dispatch({ type: 'SELECT_ITEM', id });
    },
    [dispatch, lastSelectedId, allIds]
  );

  // AC-32: Clear selection
  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  // AC-32: Escape key clears selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && selectionCount > 0) {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionCount, clearSelection]);

  return {
    selectedIds,
    isSelected,
    handleItemClick,
    clearSelection,
    selectionCount,
    hasSelection: selectionCount > 0,
  };
}

export default useSelection;
