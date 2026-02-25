/**
 * useDragAndDrop - @dnd-kit configuration and drag/drop event handlers.
 *
 * Story Reference: 21-2 Task 1 - useDragAndDrop hook
 * Architecture Reference: notes/architecture/architecture.md#Performance Considerations
 *
 * AC-21.2.4: Visual feedback within 100ms (CSS transforms, no DOM reflow)
 * AC-21.2.9: GPU-accelerated drag via @dnd-kit CSS transforms
 * AC-21.2.10: Invalid drop cancellation with no state change
 * AC-21.2.12: DndContext + SortableContext + PointerSensor + DragOverlay configuration
 */

import { useState, useCallback } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useVSCodeApi } from './useVSCodeApi';
import type { SlideEntry, AgendaSection } from '../../../shared/types';

// =============================================================================
// Types
// =============================================================================

export interface DragAndDropState {
  /** Configured sensors for DndContext */
  sensors: ReturnType<typeof useSensors>;
  /** Currently dragged slide ID (e.g., "slide-3"), null when not dragging */
  activeId: UniqueIdentifier | null;
  /** ID of the element currently being hovered over during drag */
  overId: UniqueIdentifier | null;
  /** Section ID being hovered during drag (for section header highlighting) */
  overSectionId: string | null;
  /** Handler for drag start events */
  handleDragStart: (event: DragStartEvent) => void;
  /** Handler for drag end events — sends reorder-slide message */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Handler for drag over events — tracks which section is hovered */
  handleDragOver: (event: DragOverEvent) => void;
  /** Handler for drag cancel events — resets state */
  handleDragCancel: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Extracts the slide number from a sortable item ID.
 * IDs are formatted as "slide-{number}" (e.g., "slide-3" → 3).
 */
export function slideIdToNumber(id: UniqueIdentifier): number {
  return parseInt(String(id).replace('slide-', ''), 10);
}

/**
 * Creates a sortable item ID from a slide number.
 */
export function slideNumberToId(number: number): string {
  return `slide-${number}`;
}

/**
 * Creates a droppable section ID from an agenda section ID.
 */
export function sectionDropId(sectionId: string): string {
  return `section-drop-${sectionId}`;
}

/**
 * Extracts the section ID from a droppable section ID.
 */
export function dropIdToSection(id: string): string | null {
  if (String(id).startsWith('section-drop-')) {
    return String(id).replace('section-drop-', '');
  }
  return null;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook that configures @dnd-kit for slide drag-and-drop reordering.
 *
 * Provides sensors, active drag state, and event handlers for DndContext.
 * Sends reorder-slide messages to the extension host on successful drops.
 *
 * @param slides - All slides in the plan
 * @param sections - All agenda sections
 */
export function useDragAndDrop(
  slides: SlideEntry[],
  sections: AgendaSection[]
): DragAndDropState {
  const { postMessage } = useVSCodeApi();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [overSectionId, setOverSectionId] = useState<string | null>(null);

  // Configure sensors (AC-21.2.12):
  // PointerSensor with activation constraint targeting drag handle
  // KeyboardSensor with sortable keyboard coordinates
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Only activate when dragging starts on an element with data-drag-handle
        distance: 5, // 5px threshold to distinguish click from drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag start: set activeId for DragOverlay rendering
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
    console.log(`[DnD] Drag start: slide ${slideIdToNumber(event.active.id)}`);
  }, []);

  // Drag over: track which element and section are being hovered
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverId(null);
      setOverSectionId(null);
      return;
    }

    setOverId(over.id);

    // Check if hovering over a section header drop target
    const sectionId = dropIdToSection(String(over.id));
    if (sectionId) {
      setOverSectionId(sectionId);
    } else {
      // Hovering over a slide — determine its section
      const overSlideNum = slideIdToNumber(over.id);
      const overSlide = slides.find((s) => s.number === overSlideNum);
      setOverSectionId(overSlide?.agenda_section_id ?? null);
    }
  }, [slides]);

  // Drag end: determine reorder type and send message
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setOverId(null);
      setOverSectionId(null);

      // No valid drop target → cancel (AC-21.2.10)
      if (!over) {
        console.log('[DnD] Drag cancelled: no drop target');
        return;
      }

      const activeSlideNum = slideIdToNumber(active.id);
      const activeSlide = slides.find((s) => s.number === activeSlideNum);
      if (!activeSlide) return;

      // Check if dropped on a section header
      const targetSectionId = dropIdToSection(String(over.id));
      if (targetSectionId) {
        // Cross-section move: drop on section header → append to end of section
        if (targetSectionId === activeSlide.agenda_section_id) {
          // Same section header — no-op
          console.log('[DnD] Drag end: dropped on own section header, no-op');
          return;
        }

        // Find the last slide index in target section, or global position
        const targetSectionSlides = slides.filter(
          (s) => s.agenda_section_id === targetSectionId
        );
        let newIndex: number;
        if (targetSectionSlides.length === 0) {
          // Empty section: find where this section's slides would be
          // Insert after the last slide of the preceding section
          const sectionOrder = sections.map((s) => s.id);
          const targetSectionIdx = sectionOrder.indexOf(targetSectionId);
          // Find the last slide before this section
          let insertAfterGlobalIdx = -1;
          for (let i = 0; i < slides.length; i++) {
            const slideSecIdx = sectionOrder.indexOf(slides[i].agenda_section_id);
            if (slideSecIdx < targetSectionIdx) {
              insertAfterGlobalIdx = i;
            }
          }
          newIndex = insertAfterGlobalIdx + 1;
        } else {
          // Append after last slide in target section
          const lastSlide = targetSectionSlides[targetSectionSlides.length - 1];
          newIndex = slides.indexOf(lastSlide) + 1;
        }

        console.log(
          `[DnD] Drag end: slide ${activeSlideNum} → section ${targetSectionId}, index ${newIndex}`
        );
        postMessage({
          type: 'reorder-slide',
          slideNumber: activeSlideNum,
          newIndex,
          newSectionId: targetSectionId,
        });
        return;
      }

      // Dropped on another slide → reorder
      const overSlideNum = slideIdToNumber(over.id);
      if (activeSlideNum === overSlideNum) {
        // Same position — no-op
        console.log('[DnD] Drag end: same position, no-op');
        return;
      }

      const overSlide = slides.find((s) => s.number === overSlideNum);
      if (!overSlide) return;

      const fromIndex = slides.findIndex((s) => s.number === activeSlideNum);
      const toIndex = slides.findIndex((s) => s.number === overSlideNum);

      // Determine if this is a cross-section move
      const newSectionId =
        activeSlide.agenda_section_id !== overSlide.agenda_section_id
          ? overSlide.agenda_section_id
          : undefined;

      // Convert to insertion-point index for moveSlide:
      // When moving forward, the visual intent is to place AFTER the over element,
      // so the insertion point is toIndex + 1. When moving backward, the intent is
      // to place BEFORE the over element, so insertion point is toIndex.
      const insertionIndex = fromIndex < toIndex ? toIndex + 1 : toIndex;

      console.log(
        `[DnD] Drag end: slide ${activeSlideNum} → index ${insertionIndex}${newSectionId ? `, section ${newSectionId}` : ''}`
      );

      postMessage({
        type: 'reorder-slide',
        slideNumber: activeSlideNum,
        newIndex: insertionIndex,
        newSectionId,
      });
    },
    [slides, sections, postMessage]
  );

  // Drag cancel: reset state, no message sent (AC-21.2.10)
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setOverId(null);
    setOverSectionId(null);
    console.log('[DnD] Drag cancelled');
  }, []);

  return {
    sensors,
    activeId,
    overId,
    overSectionId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  };
}
