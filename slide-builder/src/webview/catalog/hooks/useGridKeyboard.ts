/**
 * useGridKeyboard - Hook for keyboard navigation within grid layouts.
 *
 * Story Reference: cv-5-5 Task 1 — Grid keyboard navigation
 * AC-39: Arrow keys navigate between cards in the grid (left/right/up/down), wrapping at row boundaries
 * AC-40: Enter/Space activates the focused card
 */

import { useCallback, useState, useRef, useEffect } from 'react';

export interface UseGridKeyboardOptions {
  /** Total number of items in the grid */
  itemCount: number;
  /** Number of columns in the grid (for up/down navigation) */
  columns: number;
  /** Callback when Enter/Space is pressed on focused item */
  onActivate: (index: number) => void;
  /** Initial focused index (default: 0) */
  initialIndex?: number;
  /** Whether grid is disabled (no keyboard navigation) */
  disabled?: boolean;
}

export interface UseGridKeyboardResult {
  /** Currently focused item index */
  focusedIndex: number;
  /** Set the focused index programmatically */
  setFocusedIndex: (index: number) => void;
  /** Keyboard event handler to attach to grid container */
  handleKeyDown: (event: React.KeyboardEvent) => void;
  /** Get tabindex for an item (0 for focused, -1 for others) */
  getTabIndex: (index: number) => 0 | -1;
  /** Ref to attach to grid container for focus management */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Focus the item at the given index */
  focusItem: (index: number) => void;
}

/**
 * Hook for keyboard navigation within grid layouts using roving tabindex pattern.
 *
 * @param options - Configuration options for the grid keyboard navigation
 * @returns Grid keyboard navigation state and handlers
 *
 * @example
 * ```tsx
 * const { focusedIndex, handleKeyDown, getTabIndex, containerRef } = useGridKeyboard({
 *   itemCount: decks.length,
 *   columns: 3,
 *   onActivate: (index) => handleDeckClick(decks[index].id),
 * });
 *
 * return (
 *   <div ref={containerRef} role="grid" onKeyDown={handleKeyDown}>
 *     {decks.map((deck, index) => (
 *       <DeckCard
 *         key={deck.id}
 *         tabIndex={getTabIndex(index)}
 *         data-focused={focusedIndex === index}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useGridKeyboard({
  itemCount,
  columns,
  onActivate,
  initialIndex = 0,
  disabled = false,
}: UseGridKeyboardOptions): UseGridKeyboardResult {
  const [focusedIndex, setFocusedIndex] = useState(
    Math.min(initialIndex, Math.max(0, itemCount - 1))
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset focused index if it's out of bounds
  useEffect(() => {
    if (itemCount === 0) {
      setFocusedIndex(0);
    } else if (focusedIndex >= itemCount) {
      setFocusedIndex(itemCount - 1);
    }
  }, [itemCount, focusedIndex]);

  // Focus the item element at the given index
  const focusItem = useCallback((index: number) => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll<HTMLElement>('[role="gridcell"], [role="button"]');
    if (items[index]) {
      items[index].focus();
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || itemCount === 0) return;

      let nextIndex = focusedIndex;
      let handled = false;

      switch (event.key) {
        case 'ArrowRight':
          // Move to next card, wrap to start of next row
          nextIndex = focusedIndex + 1;
          if (nextIndex >= itemCount) {
            nextIndex = 0; // Wrap to beginning
          }
          handled = true;
          break;

        case 'ArrowLeft':
          // Move to previous card, wrap to end of previous row
          nextIndex = focusedIndex - 1;
          if (nextIndex < 0) {
            nextIndex = itemCount - 1; // Wrap to end
          }
          handled = true;
          break;

        case 'ArrowDown':
          // Move to card below (same column, next row)
          nextIndex = focusedIndex + columns;
          if (nextIndex >= itemCount) {
            // Wrap to same column in first row
            const currentColumn = focusedIndex % columns;
            nextIndex = currentColumn;
          }
          handled = true;
          break;

        case 'ArrowUp':
          // Move to card above (same column, previous row)
          nextIndex = focusedIndex - columns;
          if (nextIndex < 0) {
            // Wrap to same column in last row
            const currentColumn = focusedIndex % columns;
            const lastRowStart = Math.floor((itemCount - 1) / columns) * columns;
            nextIndex = Math.min(lastRowStart + currentColumn, itemCount - 1);
          }
          handled = true;
          break;

        case 'Home':
          // Jump to first card
          nextIndex = 0;
          handled = true;
          break;

        case 'End':
          // Jump to last card
          nextIndex = itemCount - 1;
          handled = true;
          break;

        case 'Enter':
        case ' ':
          // Activate focused card
          event.preventDefault();
          onActivate(focusedIndex);
          return;

        default:
          return;
      }

      if (handled) {
        event.preventDefault();
        setFocusedIndex(nextIndex);
        focusItem(nextIndex);
      }
    },
    [disabled, itemCount, focusedIndex, columns, onActivate, focusItem]
  );

  // Get tabindex for roving tabindex pattern
  const getTabIndex = useCallback(
    (index: number): 0 | -1 => {
      if (disabled || itemCount === 0) return -1;
      return index === focusedIndex ? 0 : -1;
    },
    [disabled, itemCount, focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex,
    containerRef,
    focusItem,
  };
}

export default useGridKeyboard;
