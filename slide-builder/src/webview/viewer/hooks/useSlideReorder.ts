/**
 * useSlideReorder - @dnd-kit configuration for V2 Viewer thumbnail reordering.
 *
 * v2-4-1 AC-1: Drag initiates with visual feedback within 100ms
 * v2-4-1 AC-2: Drop zone indicators during drag
 * v2-4-1 AC-3: Slide order updates immediately (optimistic)
 * v2-4-1 AC-9: Only active in presentation mode
 *
 * Architecture Reference: notes/architecture/architecture.md#@dnd-kit integration
 * Pattern Reference: src/webview/plan/hooks/useDragAndDrop.ts
 */

import { useState, useCallback, useRef } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useViewerState, useViewerDispatch } from '../context/ViewerContext';
import { useVsCodeApi } from './useVsCodeApi';

export interface SlideReorderState {
  sensors: ReturnType<typeof useSensors>;
  activeId: UniqueIdentifier | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  isDragging: boolean;
  /** Whether reorder is enabled (presentation mode only) */
  isReorderEnabled: boolean;
}

/**
 * Hook for managing slide reordering via drag-and-drop.
 * Uses @dnd-kit with PointerSensor (5px activation threshold).
 * Only active when viewer is in presentation mode (AC-9).
 */
export function useSlideReorder(): SlideReorderState {
  const state = useViewerState();
  const dispatch = useViewerDispatch();
  const { postMessage } = useVsCodeApi();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const preReorderRef = useRef<number[]>([]);

  const isReorderEnabled = state.mode === 'presentation' && state.fullscreenMode === null;

  // AC-1, NFR3: PointerSensor with 5px activation distance for responsive drag start
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (!isReorderEnabled) return;
    setActiveId(event.active.id);
    // Store pre-drag order for potential revert (AC-8)
    preReorderRef.current = state.slides.map((s) => s.number);
  }, [isReorderEnabled, state.slides]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    if (!isReorderEnabled) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Compute new order: active.id and over.id are slide numbers (as strings from sortable ids)
    const oldIndex = state.slides.findIndex((s) => `slide-${s.number}` === active.id);
    const newIndex = state.slides.findIndex((s) => `slide-${s.number}` === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Build new order using original slide numbers
    const currentOrder = state.slides.map((s) => s.number);
    const newOrder = arrayMove(currentOrder, oldIndex, newIndex);

    // AC-3: Optimistic update — dispatch immediately
    dispatch({ type: 'REORDER_SLIDES', newOrder });

    // AC-4,5: Send to extension host for manifest + plan.yaml persistence
    postMessage({ type: 'v2-reorder-slides', newOrder });
  }, [isReorderEnabled, state.slides, dispatch, postMessage]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return {
    sensors,
    activeId,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    isDragging: activeId !== null,
    isReorderEnabled,
  };
}
