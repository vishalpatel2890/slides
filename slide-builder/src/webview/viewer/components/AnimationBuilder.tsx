import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  useViewerState,
  useViewerDispatch,
  type SelectableElement,
} from '../context/ViewerContext';
import type { ViewerV2AnimationGroup } from '../../../shared/types';
import { ElementOverlay } from './ElementOverlay';
import { GroupPanel } from './GroupPanel';
import { GROUP_COLORS } from './GroupItem';
import { useVsCodeApi } from '../hooks/useVsCodeApi';
import { generateStableBuildId } from '../utils/buildId';
import * as Dialog from '@radix-ui/react-dialog';

/**
 * v2-4-5: Cross-group move confirmation state.
 */
interface MoveElementTarget {
  buildId: string;
  elementLabel: string;
  fromGroupId: string;
  toGroupId: string;
  fromGroupIndex: number;
  toGroupIndex: number;
}

/**
 * Selectable element CSS selector for DOM scanning.
 * v2-4-2 AC-2: Scans for content elements including text, images, and icons.
 * Expanded to include SVG (icons), div (boxes/containers), and other common elements.
 */
const SELECTABLE_ELEMENT_SELECTOR =
  'h1, h2, h3, h4, h5, h6, p, li, img, figure, blockquote, table, pre, code, svg, .icon, [class*="icon"], [class*="box"], [class*="card"], [data-animate], [data-build-id]';

/**
 * AnimationBuilder component — orchestrates element selection and group creation.
 *
 * v2-4-2 AC-2: Scans slide DOM for selectable elements, renders overlays
 * v2-4-2 AC-3: Click to select/deselect elements
 * v2-4-2 AC-4,5: Create Group functionality
 * v2-4-2 AC-6: Empty state when no elements found
 * v2-4-2 AC-7: Rescan on slide navigation
 * v2-4-2 AC-10: Keyboard navigation (Tab, Space, Enter)
 */
export function AnimationBuilder(): React.ReactElement {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();
  const containerRef = useRef<HTMLDivElement>(null);
  const [moveTarget, setMoveTarget] = useState<MoveElementTarget | null>(null);

  const {
    builderState: { selectableElements, selectedElementIds, isScanning, focusedIndex, selectedGroupId },
    currentSlide,
    manifest,
  } = state;

  // Get existing groups for current slide
  const currentSlideGroups =
    manifest?.slides[currentSlide - 1]?.animations?.groups ?? [];

  /**
   * Get human-readable label for an element.
   */
  const getElementLabel = useCallback((element: Element): string => {
    const tag = element.tagName.toLowerCase();
    const text = element.textContent?.trim().slice(0, 30) ?? '';
    const suffix = text.length >= 30 ? '...' : '';
    return `${tag.toUpperCase()}: ${text}${suffix}` || tag.toUpperCase();
  }, []);

  /**
   * Find which group an element belongs to (if any).
   */
  const findGroupForElement = useCallback(
    (buildId: string): string | undefined => {
      for (const group of currentSlideGroups) {
        if (group.elementIds.includes(buildId)) {
          return group.id;
        }
      }
      return undefined;
    },
    [currentSlideGroups]
  );

  /**
   * Scan the slide DOM for selectable elements.
   * v2-4-2 AC-2: Query .slide-display__container shadow root for elements.
   */
  const scanElements = useCallback(() => {
    const slideContainer = document.querySelector('.slide-display__container');
    if (!slideContainer) {
      dispatch({ type: 'SET_SELECTABLE_ELEMENTS', elements: [] });
      return;
    }

    const shadowRoot = slideContainer.shadowRoot;
    if (!shadowRoot) {
      dispatch({ type: 'SET_SELECTABLE_ELEMENTS', elements: [] });
      return;
    }

    // Query all selectable elements within the shadow DOM
    const elements = shadowRoot.querySelectorAll(SELECTABLE_ELEMENT_SELECTOR);
    const discovered: SelectableElement[] = [];
    const seenIds = new Set<string>(); // Track seen IDs for deduplication

    elements.forEach((element) => {
      // Generate stable content-based ID (preserves existing data-build-id if present)
      const buildId = generateStableBuildId(element, seenIds);

      // Assign data-build-id attribute if missing
      if (!element.getAttribute('data-build-id')) {
        element.setAttribute('data-build-id', buildId);
      }

      // Get bounding rect relative to viewport
      const rect = element.getBoundingClientRect();

      // Skip elements with zero dimensions (hidden elements)
      if (rect.width === 0 || rect.height === 0) return;

      discovered.push({
        buildId,
        tagName: element.tagName.toLowerCase(),
        label: getElementLabel(element),
        rect,
        groupId: findGroupForElement(buildId),
      });
    });

    dispatch({ type: 'SET_SELECTABLE_ELEMENTS', elements: discovered });
  }, [dispatch, getElementLabel, findGroupForElement]);

  // Scan elements when entering builder mode or changing slides (AC-7)
  useEffect(() => {
    if (state.mode !== 'animation-builder') return;

    // Initial scan with small delay to ensure DOM is rendered
    const timeoutId = setTimeout(scanElements, 100);

    // Rescan on window resize
    const handleResize = () => {
      requestAnimationFrame(scanElements);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.mode, currentSlide, scanElements]);

  // Rescan when isScanning flag is set
  useEffect(() => {
    if (isScanning) {
      scanElements();
    }
  }, [isScanning, scanElements]);

  /**
   * v2-4-4 AC-1,4,5: Toggle group selection — dispatch SELECT_GROUP or DESELECT_GROUP.
   */
  const handleSelectGroup = useCallback(
    (groupId: string) => {
      if (selectedGroupId === groupId) {
        dispatch({ type: 'DESELECT_GROUP' });
      } else {
        dispatch({ type: 'SELECT_GROUP', groupId });
      }
    },
    [selectedGroupId, dispatch]
  );

  /**
   * Create a new animation group from selected elements.
   * v2-4-2 AC-4,5: Generate group, save to manifest, clear selection.
   */
  const handleCreateGroup = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    // Calculate next group number
    const existingGroupCount = currentSlideGroups.length;
    const nextOrder = existingGroupCount + 1;
    const groupId = `group-${nextOrder}`;

    // Create new group
    const newGroup: ViewerV2AnimationGroup = {
      id: groupId,
      order: nextOrder,
      elementIds: [...selectedElementIds],
      colorIndex: existingGroupCount % 6, // Cycle through 6 colors
    };

    // Optimistic update to manifest
    dispatch({
      type: 'ADD_ANIMATION_GROUP',
      slideNumber: currentSlide,
      group: newGroup,
    });

    // Clear selection
    dispatch({ type: 'CLEAR_SELECTION' });

    // Send to extension host to persist
    postMessage({
      type: 'v2-save-animations',
      slideNumber: currentSlide,
      groups: [...currentSlideGroups, newGroup],
    });

    // Trigger rescan to update group badges
    setTimeout(scanElements, 50);
  }, [
    selectedElementIds,
    currentSlideGroups,
    currentSlide,
    dispatch,
    postMessage,
    scanElements,
  ]);

  /**
   * v2-4-5 AC-1: Remove an element from a group.
   */
  const handleRemoveElementFromGroup = useCallback(
    (buildId: string, groupId: string) => {
      const targetGroup = currentSlideGroups.find((g) => g.id === groupId);
      if (!targetGroup) return;

      const updatedGroup = {
        ...targetGroup,
        elementIds: targetGroup.elementIds.filter((id) => id !== buildId),
      };

      const updatedGroups = currentSlideGroups.map((g) =>
        g.id === groupId ? updatedGroup : g
      );

      dispatch({
        type: 'SET_SLIDE_ANIMATION_GROUPS',
        slideNumber: currentSlide,
        groups: updatedGroups,
      });

      postMessage({
        type: 'v2-save-animations',
        slideNumber: currentSlide,
        groups: updatedGroups,
      });

      setTimeout(scanElements, 50);
    },
    [currentSlideGroups, currentSlide, dispatch, postMessage, scanElements]
  );

  /**
   * v2-4-5 AC-2: Add an element to a group.
   */
  const handleAddElementToGroup = useCallback(
    (buildId: string, groupId: string) => {
      const targetGroup = currentSlideGroups.find((g) => g.id === groupId);
      if (!targetGroup) return;

      const updatedGroup = {
        ...targetGroup,
        elementIds: [...targetGroup.elementIds, buildId],
      };

      const updatedGroups = currentSlideGroups.map((g) =>
        g.id === groupId ? updatedGroup : g
      );

      dispatch({
        type: 'SET_SLIDE_ANIMATION_GROUPS',
        slideNumber: currentSlide,
        groups: updatedGroups,
      });

      postMessage({
        type: 'v2-save-animations',
        slideNumber: currentSlide,
        groups: updatedGroups,
      });

      setTimeout(scanElements, 50);
    },
    [currentSlideGroups, currentSlide, dispatch, postMessage, scanElements]
  );

  /**
   * v2-4-5 AC-4: Confirm cross-group move — remove from source, add to target.
   */
  const handleConfirmMove = useCallback(() => {
    if (!moveTarget) return;

    const updatedGroups = currentSlideGroups.map((g) => {
      if (g.id === moveTarget.fromGroupId) {
        return {
          ...g,
          elementIds: g.elementIds.filter((id) => id !== moveTarget.buildId),
        };
      }
      if (g.id === moveTarget.toGroupId) {
        return {
          ...g,
          elementIds: [...g.elementIds, moveTarget.buildId],
        };
      }
      return g;
    });

    dispatch({
      type: 'SET_SLIDE_ANIMATION_GROUPS',
      slideNumber: currentSlide,
      groups: updatedGroups,
    });

    postMessage({
      type: 'v2-save-animations',
      slideNumber: currentSlide,
      groups: updatedGroups,
    });

    setMoveTarget(null);
    setTimeout(scanElements, 50);
  }, [moveTarget, currentSlideGroups, currentSlide, dispatch, postMessage, scanElements]);

  /**
   * Handle element click from overlay.
   * v2-4-2 AC-3: Toggle selection state (when no group selected).
   * v2-4-5 AC-1,2,3,7: Group-aware add/remove/move behavior.
   */
  const handleElementClick = useCallback(
    (buildId: string) => {
      // v2-4-5 AC-7: No group selected → existing toggle-selection behavior
      if (!selectedGroupId) {
        dispatch({ type: 'TOGGLE_ELEMENT_SELECTION', buildId });
        return;
      }

      // Group is selected — determine element's current group
      const elementGroupId = findGroupForElement(buildId);

      if (elementGroupId === selectedGroupId) {
        // v2-4-5 AC-1: Element is in the selected group → remove
        handleRemoveElementFromGroup(buildId, selectedGroupId);
      } else if (!elementGroupId) {
        // v2-4-5 AC-2: Element is ungrouped → add to selected group
        handleAddElementToGroup(buildId, selectedGroupId);
      } else {
        // v2-4-5 AC-3: Element is in a DIFFERENT group → show move confirmation
        const element = selectableElements.find((e) => e.buildId === buildId);
        const fromGroupIndex = currentSlideGroups.findIndex((g) => g.id === elementGroupId) + 1;
        const toGroupIndex = currentSlideGroups.findIndex((g) => g.id === selectedGroupId) + 1;

        setMoveTarget({
          buildId,
          elementLabel: element?.label ?? buildId,
          fromGroupId: elementGroupId,
          toGroupId: selectedGroupId,
          fromGroupIndex,
          toGroupIndex,
        });
      }
    },
    [
      selectedGroupId,
      dispatch,
      findGroupForElement,
      handleRemoveElementFromGroup,
      handleAddElementToGroup,
      selectableElements,
      currentSlideGroups,
    ]
  );

  /**
   * Handle keyboard navigation within the builder.
   * v2-4-2 AC-10: Tab cycles, Space toggles, Enter creates group.
   * v2-4-4 AC-6: Escape deselects group first, then exits builder.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // v2-4-4 AC-6: Escape priority — deselect group before exiting builder
      if (event.key === 'Escape') {
        if (selectedGroupId) {
          event.preventDefault();
          dispatch({ type: 'DESELECT_GROUP' });
          return;
        }
        // No group selected — let parent handle Escape (exit builder)
        return;
      }

      if (selectableElements.length === 0) return;

      switch (event.key) {
        case 'Tab': {
          event.preventDefault();
          const nextIndex = event.shiftKey
            ? (focusedIndex <= 0 ? selectableElements.length - 1 : focusedIndex - 1)
            : (focusedIndex >= selectableElements.length - 1 ? 0 : focusedIndex + 1);
          dispatch({ type: 'SET_FOCUSED_ELEMENT', index: nextIndex });
          break;
        }
        case ' ': {
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < selectableElements.length) {
            const element = selectableElements[focusedIndex];
            // v2-4-5 AC-8: Route through same add/remove/move logic as click
            handleElementClick(element.buildId);
          }
          break;
        }
        case 'Enter': {
          event.preventDefault();
          if (selectedElementIds.length > 0) {
            handleCreateGroup();
          }
          break;
        }
      }
    },
    [focusedIndex, selectableElements, selectedElementIds, selectedGroupId, dispatch, handleElementClick, handleCreateGroup]
  );

  /**
   * Delete an animation group.
   * v2-4-3 AC-3: Remove group, renumber remaining, save via v2-save-animations.
   */
  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      const updatedGroups = currentSlideGroups
        .filter((g) => g.id !== groupId)
        .map((g, idx) => ({
          ...g,
          order: idx + 1,
          colorIndex: idx % 6,
        }));

      dispatch({
        type: 'SET_SLIDE_ANIMATION_GROUPS',
        slideNumber: currentSlide,
        groups: updatedGroups,
      });

      postMessage({
        type: 'v2-save-animations',
        slideNumber: currentSlide,
        groups: updatedGroups,
      });

      // Rescan to update group badges on overlays
      setTimeout(scanElements, 50);
    },
    [currentSlideGroups, currentSlide, dispatch, postMessage, scanElements]
  );

  /**
   * Reorder animation groups.
   * v2-4-3 AC-4: Update order fields, save via v2-save-animations.
   */
  const handleReorderGroups = useCallback(
    (reorderedGroups: ViewerV2AnimationGroup[]) => {
      dispatch({
        type: 'SET_SLIDE_ANIMATION_GROUPS',
        slideNumber: currentSlide,
        groups: reorderedGroups,
      });

      postMessage({
        type: 'v2-save-animations',
        slideNumber: currentSlide,
        groups: reorderedGroups,
      });

      // Rescan to update group badges on overlays
      setTimeout(scanElements, 50);
    },
    [currentSlide, dispatch, postMessage, scanElements]
  );

  // Get container offset for overlay positioning
  const getOverlayContainerOffset = useCallback(() => {
    const slideContainer = document.querySelector('.slide-display__container');
    if (!slideContainer) return { left: 0, top: 0 };
    const rect = slideContainer.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }, []);

  // Empty state (AC-6)
  if (!isScanning && selectableElements.length === 0) {
    return (
      <div className="animation-builder animation-builder--empty">
        <div className="animation-builder__empty-state">
          <p className="animation-builder__empty-message">
            No animatable elements found on this slide.
          </p>
        </div>
      </div>
    );
  }

  const containerOffset = getOverlayContainerOffset();

  return (
    <div
      ref={containerRef}
      className="animation-builder"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="application"
      aria-label="Animation builder: select elements to create animation groups"
    >
      {/* Element overlays */}
      <div className="animation-builder__overlays">
        {selectableElements.map((element, index) => {
          // v2-4-4: Compute element's own group color (always visible for grouped elements)
          const elementGroup = element.groupId
            ? currentSlideGroups.find((g) => g.id === element.groupId)
            : null;
          const groupColor = elementGroup
            ? GROUP_COLORS[elementGroup.colorIndex % GROUP_COLORS.length]
            : null;

          // v2-4-4: Compute active selection color coding
          const selectedGroup = selectedGroupId
            ? currentSlideGroups.find((g) => g.id === selectedGroupId)
            : null;
          const belongsToSelectedGroup = selectedGroup
            ? selectedGroup.elementIds.includes(element.buildId)
            : false;
          const activeGroupColor = belongsToSelectedGroup
            ? GROUP_COLORS[selectedGroup!.colorIndex % GROUP_COLORS.length]
            : null;
          const isDimmed = selectedGroupId !== null && !belongsToSelectedGroup;

          return (
            <ElementOverlay
              key={element.buildId}
              element={element}
              isSelected={selectedElementIds.includes(element.buildId)}
              isFocused={focusedIndex === index}
              groupNumber={
                element.groupId
                  ? currentSlideGroups.findIndex((g) => g.id === element.groupId) + 1
                  : undefined
              }
              onClick={handleElementClick}
              containerOffset={containerOffset}
              groupColor={groupColor}
              activeGroupColor={activeGroupColor}
              isDimmed={isDimmed}
            />
          );
        })}
      </div>

      {/* v2-4-2 + v2-4-3 + v2-4-4: Combined panel with Create Group, Group management, and selection */}
      <GroupPanel
        groups={currentSlideGroups}
        onDeleteGroup={handleDeleteGroup}
        onReorderGroups={handleReorderGroups}
        selectedCount={selectedElementIds.length}
        onCreateGroup={handleCreateGroup}
        selectedGroupId={selectedGroupId}
        onSelectGroup={handleSelectGroup}
      />

      {/* v2-4-5 AC-3,4,5: Cross-group move confirmation dialog */}
      <Dialog.Root
        open={moveTarget !== null}
        onOpenChange={(open) => { if (!open) setMoveTarget(null); }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="group-panel__dialog-overlay" />
          <Dialog.Content className="group-panel__dialog">
            <Dialog.Title className="group-panel__dialog-title">
              Move element?
            </Dialog.Title>
            <Dialog.Description className="group-panel__dialog-description">
              {moveTarget
                ? `Move "${moveTarget.elementLabel}" from Group ${moveTarget.fromGroupIndex} to Group ${moveTarget.toGroupIndex}?`
                : ''}
            </Dialog.Description>
            <div className="group-panel__dialog-actions">
              <Dialog.Close asChild>
                <button
                  className="group-panel__dialog-cancel"
                  autoFocus
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className="group-panel__dialog-move"
                onClick={handleConfirmMove}
              >
                Move
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

