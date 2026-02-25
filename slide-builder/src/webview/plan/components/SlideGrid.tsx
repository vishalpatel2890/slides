/**
 * SlideGrid - Responsive grid container for slide cards organized by sections.
 *
 * Story Reference: 19-1 Task 3 & 4 - Create SlideGrid Container with Keyboard Navigation
 * Story Reference: 19-2 Task 2, 3, 4 - Section Grouping, Radix Accordion, Empty State
 * Story Reference: 21-2 Task 2 - DndContext and SortableContext wrappers
 * Architecture Reference: notes/architecture/architecture.md#ADR-005 - useReducer + Context
 *
 * AC-19.1.2: Card grid uses CSS Grid with auto-fill, minmax(240px, 1fr)
 * AC-19.1.7: ARIA attributes for accessibility
 * AC-19.1.8: Arrow keys navigate between cards; Enter/Space selects
 * AC-19.2.1: Slides grouped under agenda section headers by agenda_section_id
 * AC-19.2.3: Sections use Radix Accordion primitive for collapse/expand behavior
 * AC-19.2.5: Collapsed sections hide cards; expanded sections show them
 * AC-19.2.7: Empty sections display placeholder message
 * AC-21.2.3: Drop zones highlight between cards and on section headers during active drag
 * AC-21.2.12: DndContext wrapping the slide grid, SortableContext per section + drop indicator
 */

import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { usePlan, usePlanData, useSelectedSlide, useExpandedSections } from '../context/PlanContext';
import { useVSCodeApi } from '../hooks/useVSCodeApi';
import { useDragAndDrop, slideNumberToId, slideIdToNumber, dropIdToSection } from '../hooks/useDragAndDrop';
import { SlideCard } from './SlideCard';
import { SlideContextMenu } from './SlideContextMenu';
import { SectionHeader } from './SectionHeader';
import { cn } from '../lib/utils';
import type { AgendaSection, SlideEntry } from '../../../shared/types';
import { getAgendaSections, getSlideIntent } from '../../../shared/types';

// =============================================================================
// Helper: groupSlidesBySection
// AC-19.2.1 & Task 3.2: Group slides by agenda_section_id
// =============================================================================

/**
 * Groups slides by their agenda_section_id, maintaining section order.
 * Slides with missing/invalid agenda_section_id are grouped under "uncategorized".
 */
function groupSlidesBySection(
  slides: SlideEntry[],
  sections: AgendaSection[]
): Map<string, SlideEntry[]> {
  const grouped = new Map<string, SlideEntry[]>();

  // Initialize all sections (even empty ones)
  for (const section of sections) {
    grouped.set(section.id, []);
  }
  // Add uncategorized bucket for slides without valid section
  grouped.set('uncategorized', []);

  // Group slides by agenda_section_id
  for (const slide of slides) {
    const sectionId = slide.agenda_section_id || 'uncategorized';
    const sectionSlides = grouped.get(sectionId);
    if (sectionSlides) {
      sectionSlides.push(slide);
    } else {
      // Section ID doesn't exist in agenda_sections - put in uncategorized
      const uncategorized = grouped.get('uncategorized') ?? [];
      uncategorized.push(slide);
      grouped.set('uncategorized', uncategorized);
    }
  }

  return grouped;
}

// =============================================================================
// Props Interface
// =============================================================================

export interface SlideGridProps {
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// EmptySectionPlaceholder Component
// AC-19.2.7: Empty sections display elegant empty state with add action
// =============================================================================

interface EmptySectionPlaceholderProps {
  sectionId: string;
  onAddSlide: (afterSlideNumber: number, sectionId: string) => void;
}

function EmptySectionPlaceholder({ sectionId, onAddSlide }: EmptySectionPlaceholderProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      {/* Empty state icon - subtle outline */}
      <div className="w-10 h-10 rounded-xl bg-[var(--surface)] flex items-center justify-center">
        <svg
          className="w-5 h-5 text-[var(--fg-faint)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <p className="text-[13px] text-[var(--fg-muted)]">
        No slides in this section
      </p>
      <button
        type="button"
        onClick={() => onAddSlide(0, sectionId)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
          'text-[12px] font-medium text-[var(--primary)]',
          'bg-[var(--primary-light)]/50 hover:bg-[var(--primary-light)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
          'transition-colors duration-150'
        )}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add first slide
      </button>
    </div>
  );
}

// =============================================================================
// AddCardButton Component - Elegant reveal on hover
// =============================================================================

interface AddCardButtonProps {
  afterSlideNumber: number; // 0 = add at beginning of section
  sectionId: string;
  onAddSlide: (afterSlideNumber: number, sectionId: string) => void;
}

function AddCardButton({ afterSlideNumber, sectionId, onAddSlide }: AddCardButtonProps): React.ReactElement {
  return (
    <div className="group/add flex items-center justify-center py-1">
      <button
        type="button"
        onClick={() => onAddSlide(afterSlideNumber, sectionId)}
        style={{ opacity: 0, transition: 'opacity 200ms' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
        onFocus={(e) => { e.currentTarget.style.opacity = '1'; }}
        onBlur={(e) => { e.currentTarget.style.opacity = '0'; }}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-lg',
          'text-[12px] font-medium text-[var(--fg-muted)]',
          'border border-dashed border-[var(--border)]',
          'hover:border-[var(--primary)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
        )}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add slide</span>
      </button>
    </div>
  );
}

// =============================================================================
// DropIndicator Component - Visual insertion line during drag
// Shows a colored line with a dot to indicate where the dragged item will land
// =============================================================================

function DropIndicator(): React.ReactElement {
  return (
    <div className="flex items-center py-0.5 pointer-events-none" aria-hidden="true">
      <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] -mr-px flex-shrink-0" />
      <div className="flex-1 h-[2px] bg-[var(--primary)] rounded-full" />
    </div>
  );
}

// =============================================================================
// SectionCardList Component - Outline style vertical list with SortableContext
// Renders slide cards in a vertical stack within a section
// =============================================================================

interface SectionCardListProps {
  slides: SlideEntry[];
  allSlides: SlideEntry[]; // Global slides array for drop indicator positioning
  allSections: AgendaSection[]; // All sections for context menu
  selectedSlide: number | null;
  onSelect: (slideNumber: number) => void;
  onAddSlide: (afterSlideNumber: number, sectionId: string) => void;
  onMoveToSection: (slideNumber: number, sectionId: string) => void;
  onBuild: (slideNumber: number) => void; // BR-1.3 AC-14: Build single slide
  startIndex: number; // For keyboard navigation tracking
  onFocus: (index: number) => () => void;
  focusedIndex: number;
  sectionTitle: string; // For ARIA labeling
  sectionId: string;
  isDragging: boolean; // Whether a drag is currently active
  activeSlideNumber: number | null; // The slide being dragged
  overSlideNumber: number | null; // The slide being hovered over
}

function SectionCardList({
  slides,
  allSlides,
  allSections,
  selectedSlide,
  onSelect,
  onAddSlide,
  onMoveToSection,
  onBuild,
  startIndex,
  onFocus,
  focusedIndex,
  sectionTitle,
  sectionId,
  isDragging,
  activeSlideNumber,
  overSlideNumber,
}: SectionCardListProps): React.ReactElement {
  if (slides.length === 0) {
    return <EmptySectionPlaceholder sectionId={sectionId} onAddSlide={onAddSlide} />;
  }

  // Per-section SortableContext for within-section item shifting
  const sortableItems = slides.map((s) => slideNumberToId(s.number));

  // Compute drop indicator position based on global drag state
  // The indicator shows where the dragged item will land relative to the hovered item
  let indicatorPosition: { slideNumber: number; side: 'before' | 'after' } | null = null;
  if (activeSlideNumber != null && overSlideNumber != null && activeSlideNumber !== overSlideNumber) {
    // Check if the hovered slide is in THIS section
    const overInThisSection = slides.some((s) => s.number === overSlideNumber);
    if (overInThisSection) {
      const fromIndex = allSlides.findIndex((s) => s.number === activeSlideNumber);
      const toIndex = allSlides.findIndex((s) => s.number === overSlideNumber);
      // Moving forward → indicator after hovered item; moving backward → indicator before
      indicatorPosition = {
        slideNumber: overSlideNumber,
        side: fromIndex < toIndex ? 'after' : 'before',
      };
    }
  }

  return (
    <div className="flex flex-col pt-4 pb-3">
      <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
        <div
          className="flex flex-col"
          role="row"
          aria-label={`${sectionTitle} slides`}
        >
          {slides.map((slide, localIndex) => {
            const globalIndex = startIndex + localIndex;
            const showBefore = indicatorPosition?.slideNumber === slide.number && indicatorPosition.side === 'before';
            const showAfter = indicatorPosition?.slideNumber === slide.number && indicatorPosition.side === 'after';
            return (
              <React.Fragment key={slide.number}>
                {showBefore && <DropIndicator />}
                <SlideContextMenu
                  slide={slide}
                  sections={allSections}
                  onMoveToSection={(targetSectionId) => onMoveToSection(slide.number, targetSectionId)}
                >
                  <SlideCard
                    slide={slide}
                    selected={selectedSlide === slide.number}
                    onSelect={onSelect}
                    onBuild={onBuild}
                    tabIndex={focusedIndex === globalIndex || (focusedIndex === -1 && globalIndex === 0) ? 0 : -1}
                    onFocus={onFocus(globalIndex)}
                    animationIndex={localIndex}
                    dndEnabled={true}
                  />
                </SlideContextMenu>
                {showAfter && <DropIndicator />}
                {/* Hide add buttons during drag to reduce visual clutter */}
                {!isDragging && (
                  <AddCardButton afterSlideNumber={slide.number} sectionId={sectionId} onAddSlide={onAddSlide} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}

// =============================================================================
// DragOverlay Content - Floating card copy during drag
// AC-21.2.12: DragOverlay for the floating card during drag
// =============================================================================

interface DragOverlayContentProps {
  slide: SlideEntry;
}

function DragOverlayContent({ slide }: DragOverlayContentProps): React.ReactElement {
  const intent = getSlideIntent(slide);
  const hasIntent = intent.trim().length > 0;

  return (
    <div
      className={cn(
        'flex gap-4 rounded-md bg-[var(--card)] border border-[var(--primary)]',
        'px-5 py-4 shadow-xl cursor-grabbing',
        'ring-2 ring-[var(--primary)]/20'
      )}
    >
      <div className="flex-shrink-0 w-6 pt-0.5 ml-4">
        <span className="text-[13px] font-medium tabular-nums text-[var(--primary)]">
          {slide.number}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'text-[14px] font-medium leading-snug tracking-[-0.01em]',
          hasIntent ? 'text-[var(--fg)]' : 'text-[var(--fg-faint)]'
        )}>
          {hasIntent ? intent : 'Untitled slide'}
        </h3>
      </div>
    </div>
  );
}

// =============================================================================
// SlideGrid Component
// =============================================================================

/**
 * SlideGrid displays slides organized into collapsible agenda sections.
 * Wraps content with DndContext for drag-and-drop reordering (AC-21.2.12).
 */
export function SlideGrid({ className }: SlideGridProps): React.ReactElement {
  const plan = usePlanData();
  const selectedSlide = useSelectedSlide();
  const expandedSections = useExpandedSections();
  const { dispatch } = usePlan();
  const { postMessage } = useVSCodeApi();

  const containerRef = useRef<HTMLDivElement>(null);

  // Track focused card index for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const slides = plan?.slides ?? [];
  const sections = getAgendaSections(plan);
  const slideCount = slides.length;

  // DnD state from custom hook (AC-21.2.12)
  const {
    sensors,
    activeId,
    overId,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragCancel,
  } = useDragAndDrop(slides, sections);

  // Find the active slide for DragOverlay rendering
  const activeSlide = activeId
    ? slides.find((s) => s.number === slideIdToNumber(activeId))
    : null;

  // AC-21.1.4: Track previous slide numbers to detect newly added slides for auto-selection
  const prevSlideNumbersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const currentNumbers = new Set(slides.map((s) => s.number));
    const prevNumbers = prevSlideNumbersRef.current;

    // Detect newly added slide: current has a number that previous didn't
    if (prevNumbers.size > 0 && currentNumbers.size > prevNumbers.size) {
      for (const num of currentNumbers) {
        if (!prevNumbers.has(num)) {
          // Auto-select the newly added slide
          dispatch({ type: 'SELECT_SLIDE', slideNumber: num });
          break;
        }
      }
    }

    prevSlideNumbersRef.current = currentNumbers;
  }, [slides, dispatch]);

  // Group slides by section (memoized for performance)
  const groupedSlides = useMemo(
    () => groupSlidesBySection(slides, sections),
    [slides, sections]
  );

  // Calculate starting indices for each section (for global keyboard navigation)
  const sectionStartIndices = useMemo(() => {
    const indices = new Map<string, number>();
    let currentIndex = 0;
    for (const section of sections) {
      indices.set(section.id, currentIndex);
      currentIndex += groupedSlides.get(section.id)?.length ?? 0;
    }
    // Uncategorized at the end
    const uncategorizedSlides = groupedSlides.get('uncategorized') ?? [];
    if (uncategorizedSlides.length > 0) {
      indices.set('uncategorized', currentIndex);
    }
    return indices;
  }, [sections, groupedSlides]);

  // =============================================================================
  // Selection Handler
  // =============================================================================

  const handleSelect = useCallback(
    (slideNumber: number): void => {
      dispatch({ type: 'SELECT_SLIDE', slideNumber });
    },
    [dispatch]
  );

  // =============================================================================
  // Add Slide Handler (AC-21.1.1, AC-21.1.2)
  // =============================================================================

  const handleAddSlide = useCallback(
    (afterSlideNumber: number, sectionId: string): void => {
      postMessage({ type: 'add-slide', afterSlideNumber, sectionId });
    },
    [postMessage]
  );

  // =============================================================================
  // Build Slide Handler (BR-1.3 AC-14: Build single slide via Claude Code)
  // =============================================================================

  const handleBuildSlide = useCallback(
    (slideNumber: number): void => {
      console.log('[SlideGrid] handleBuildSlide called for slide', slideNumber);
      postMessage({ type: 'build-slide', slideNumber });
    },
    [postMessage]
  );

  // =============================================================================
  // Move to Section Handler (AC-21.3.8: Context menu "Move to section")
  // Sends reorder-slide with newIndex=-1 (append to end of target section)
  // =============================================================================

  const handleMoveToSection = useCallback(
    (slideNumber: number, targetSectionId: string): void => {
      pendingFocusSlideRef.current = slideNumber;
      postMessage({
        type: 'reorder-slide',
        slideNumber,
        newIndex: -1,
        newSectionId: targetSectionId,
      });
    },
    [postMessage]
  );

  // =============================================================================
  // Accordion Value Change Handler
  // AC-19.2.8: Session persistence via context state
  // =============================================================================

  const handleValueChange = useCallback(
    (value: string[]): void => {
      dispatch({ type: 'SET_EXPANDED_SECTIONS', sectionIds: value });
    },
    [dispatch]
  );

  // Track which slide to refocus after a reorder (focus restoration after Alt+↑/↓)
  const pendingFocusSlideRef = useRef<number | null>(null);

  // After plan updates (reorder confirmation), restore focus to the moved card
  useEffect(() => {
    if (pendingFocusSlideRef.current !== null) {
      const slideNumber = pendingFocusSlideRef.current;
      pendingFocusSlideRef.current = null;
      // Find the card's new global index after reorder
      const newGlobalIndex = slides.findIndex((s) => s.number === slideNumber);
      if (newGlobalIndex !== -1) {
        setFocusedIndex(newGlobalIndex);
        requestAnimationFrame(() => {
          const cards = containerRef.current?.querySelectorAll('[role="gridcell"]');
          const cardElement = cards?.[newGlobalIndex] as HTMLElement | undefined;
          cardElement?.focus();
        });
      }
    }
  }, [slides]);

  // =============================================================================
  // Keyboard Navigation - Grid traversal with Alt+↑/↓ reorder
  // AC-19.1.8: Arrow keys navigate between cards
  // AC-21.3.1/2/3: Alt+↑/↓ moves slides within section
  // AC-21.3.5: Tab region navigation
  // AC-21.3.7: Escape deselects
  // =============================================================================

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (slideCount === 0) return;

      // --- Alt+Arrow: Reorder slide within section (AC-21.3.1, AC-21.3.2, AC-21.3.3) ---
      if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        e.stopPropagation();

        if (focusedIndex < 0 || focusedIndex >= slideCount) return;

        const currentSlide = slides[focusedIndex];
        if (!currentSlide) return;

        // Get slides in the same section
        const sectionId = currentSlide.agenda_section_id || 'uncategorized';
        const sectionSlides = slides.filter(
          (s) => (s.agenda_section_id || 'uncategorized') === sectionId
        );
        const localIndex = sectionSlides.findIndex((s) => s.number === currentSlide.number);

        if (e.key === 'ArrowUp') {
          // Boundary guard: first slide in section → no-op (AC-21.3.3)
          if (localIndex <= 0) return;
          // Swap with previous slide in section
          const prevSlide = sectionSlides[localIndex - 1];
          const prevGlobalIndex = slides.findIndex((s) => s.number === prevSlide.number);
          pendingFocusSlideRef.current = currentSlide.number;
          postMessage({
            type: 'reorder-slide',
            slideNumber: currentSlide.number,
            newIndex: prevGlobalIndex,
          });
        } else {
          // Alt+ArrowDown
          // Boundary guard: last slide in section → no-op (AC-21.3.3)
          if (localIndex >= sectionSlides.length - 1) return;
          // Swap with next slide in section
          const nextSlide = sectionSlides[localIndex + 1];
          const nextGlobalIndex = slides.findIndex((s) => s.number === nextSlide.number);
          pendingFocusSlideRef.current = currentSlide.number;
          postMessage({
            type: 'reorder-slide',
            slideNumber: currentSlide.number,
            newIndex: nextGlobalIndex + 1, // +1 because moveSlide adjusts for forward moves
          });
        }
        return;
      }

      // --- Escape: Deselect current card (AC-21.3.7) ---
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedSlide !== null) {
          dispatch({ type: 'SELECT_SLIDE', slideNumber: null });
        }
        return;
      }

      // --- Arrow keys: Grid traversal (AC-21.3.4) ---
      let newIndex = focusedIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newIndex = Math.min(focusedIndex + 1, slideCount - 1);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newIndex = Math.max(focusedIndex - 1, 0);
          break;

        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          newIndex = slideCount - 1;
          break;

        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        setFocusedIndex(newIndex);
        // Focus the card element
        const cards = containerRef.current?.querySelectorAll('[role="gridcell"]');
        const cardElement = cards?.[newIndex] as HTMLElement | undefined;
        cardElement?.focus();
      }
    },
    [focusedIndex, slideCount, slides, selectedSlide, dispatch, postMessage]
  );

  // =============================================================================
  // Focus Tracking
  // =============================================================================

  const handleFocus = useCallback(
    (index: number) => (): void => {
      setFocusedIndex(index);
    },
    []
  );

  // =============================================================================
  // Empty State - No plan or no slides at all
  // =============================================================================

  if (!plan) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-64 gap-4', className)}>
        <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] flex items-center justify-center">
          <svg
            className="w-7 h-7 text-[var(--fg-faint)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-[14px] font-medium text-[var(--fg-secondary)]">
            No deck loaded
          </p>
          <p className="text-[13px] text-[var(--fg-muted)] mt-1">
            Open a plan.yaml file to get started
          </p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // Uncategorized Section (for slides without valid agenda_section_id)
  // =============================================================================

  const uncategorizedSlides = groupedSlides.get('uncategorized') ?? [];
  const uncategorizedSection: AgendaSection = {
    id: 'uncategorized',
    title: 'Uncategorized',
    narrative_role: 'Slides without assigned section',
  };

  const isDragging = activeId !== null;

  // Compute slide numbers for drop indicator positioning
  const activeSlideNumber = activeId ? slideIdToNumber(activeId) : null;
  const overSlideNumber = overId && !dropIdToSection(String(overId))
    ? slideIdToNumber(overId)
    : null;

  // =============================================================================
  // Render - DndContext wraps the entire accordion (AC-21.2.12)
  // =============================================================================

  return (
    <div
      ref={containerRef}
      className={cn('flex flex-col gap-4', className)}
      role="grid"
      aria-label="Slide deck overview"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
      >
        <Accordion.Root
          type="multiple"
          value={expandedSections}
          onValueChange={handleValueChange}
          className="flex flex-col gap-5"
        >
          {/* Render each agenda section */}
          {sections.map((section) => {
            const sectionSlides = groupedSlides.get(section.id) ?? [];
            const startIndex = sectionStartIndices.get(section.id) ?? 0;

            return (
              <Accordion.Item
                key={section.id}
                value={section.id}
                className="group"
              >
                <Accordion.Trigger asChild>
                  <SectionHeader
                    section={section}
                    slideCount={sectionSlides.length}
                    dndEnabled={isDragging}
                  />
                </Accordion.Trigger>
                <Accordion.Content
                  className={cn(
                    'overflow-hidden',
                    'data-[state=open]:animate-accordion-down',
                    'data-[state=closed]:animate-accordion-up'
                  )}
                >
                  <SectionCardList
                    slides={sectionSlides}
                    allSlides={slides}
                    allSections={sections}
                    selectedSlide={selectedSlide}
                    onSelect={handleSelect}
                    onAddSlide={handleAddSlide}
                    onMoveToSection={handleMoveToSection}
                    onBuild={handleBuildSlide}
                    startIndex={startIndex}
                    onFocus={handleFocus}
                    focusedIndex={focusedIndex}
                    sectionTitle={section.title}
                    sectionId={section.id}
                    isDragging={isDragging}
                    activeSlideNumber={activeSlideNumber}
                    overSlideNumber={overSlideNumber}
                  />
                </Accordion.Content>
              </Accordion.Item>
            );
          })}

          {/* Render uncategorized section if there are slides without valid section */}
          {uncategorizedSlides.length > 0 && (
            <Accordion.Item
              key="uncategorized"
              value="uncategorized"
              className="group"
            >
              <Accordion.Trigger asChild>
                <SectionHeader
                  section={uncategorizedSection}
                  slideCount={uncategorizedSlides.length}
                  dndEnabled={isDragging}
                />
              </Accordion.Trigger>
              <Accordion.Content
                className={cn(
                  'overflow-hidden',
                  'data-[state=open]:animate-accordion-down',
                  'data-[state=closed]:animate-accordion-up'
                )}
              >
                <SectionCardList
                  slides={uncategorizedSlides}
                  allSlides={slides}
                  allSections={sections}
                  selectedSlide={selectedSlide}
                  onSelect={handleSelect}
                  onAddSlide={handleAddSlide}
                  onMoveToSection={handleMoveToSection}
                  onBuild={handleBuildSlide}
                  startIndex={sectionStartIndices.get('uncategorized') ?? 0}
                  onFocus={handleFocus}
                  focusedIndex={focusedIndex}
                  sectionTitle={uncategorizedSection.title}
                  sectionId={uncategorizedSection.id}
                  isDragging={isDragging}
                  activeSlideNumber={activeSlideNumber}
                  overSlideNumber={overSlideNumber}
                />
              </Accordion.Content>
            </Accordion.Item>
          )}
        </Accordion.Root>

        {/* DragOverlay - floating card copy during drag (AC-21.2.12) */}
        <DragOverlay>
          {activeSlide ? <DragOverlayContent slide={activeSlide} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Export the helper function for testing
export { groupSlidesBySection };
