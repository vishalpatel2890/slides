import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ViewerV2SlideContent } from '../../../shared/types';
import { ThumbnailCard } from './ThumbnailCard';
import { useSlideReorder } from '../hooks/useSlideReorder';
import { adaptCssForShadowDom } from '../utils/adaptCssForShadowDom';

/**
 * Scrollable sidebar containing thumbnail previews of all slides.
 * v2-1-4 AC-1: 180px width sidebar with miniature previews
 * v2-1-4 AC-4: Auto-scroll to keep active thumbnail visible
 * v2-2-1 AC-5,6: Collapsible with smooth 200ms transition
 * v2-4-1 AC-1,2,3: Drag-and-drop reordering with DndContext + SortableContext
 *
 * Architecture Reference: Thumbnail Sidebar from notes/architecture/architecture.md
 */
interface ThumbnailSidebarProps {
  /** Array of all slide content */
  slides: ViewerV2SlideContent[];
  /** Currently displayed slide number (1-based) */
  currentSlide: number;
  /** Handler to navigate to a specific slide */
  onNavigate: (slideNumber: number) => void;
  /** Whether the sidebar is collapsed (v2-2-1 AC-5,6) */
  collapsed?: boolean;
}

/**
 * Small helper that renders slide HTML into a Shadow DOM div for the DragOverlay.
 * Ensures CSS :root/:host and body selectors work correctly in the overlay thumbnail.
 */
function OverlayPreview({ html, scale }: { html: string; scale: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!ref.current.shadowRoot) {
      ref.current.attachShadow({ mode: 'open' });
    }
    ref.current.shadowRoot!.innerHTML = adaptCssForShadowDom(html);
  }, [html]);

  return (
    <div
      ref={ref}
      className="thumbnail-card__preview thumbnail-card__preview--overlay"
      style={{
        width: 1920,
        height: 1080,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    />
  );
}

export function ThumbnailSidebar({
  slides,
  currentSlide,
  onNavigate,
  collapsed = false,
}: ThumbnailSidebarProps): React.ReactElement {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<HTMLDivElement>(null);

  // cv-bugfix-thumbnail-rendering AC-5: Track sidebar width for dynamic DragOverlay scale
  const [sidebarWidth, setSidebarWidth] = useState(0);

  // v2-4-1: @dnd-kit reorder hook
  const {
    sensors,
    activeId,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    isReorderEnabled,
  } = useSlideReorder();

  // Memoize sortable IDs for SortableContext
  const sortableIds = useMemo(
    () => slides.map((slide) => `slide-${slide.number}`),
    [slides]
  );

  // Find active slide for DragOverlay
  const activeSlide = useMemo(() => {
    if (!activeId) return null;
    const slideNum = parseInt(String(activeId).replace('slide-', ''), 10);
    return slides.find((s) => s.number === slideNum) ?? null;
  }, [activeId, slides]);

  // cv-bugfix-thumbnail-rendering AC-5: Measure sidebar scroll container width for dynamic overlay scale
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setSidebarWidth(el.clientWidth);
    });
    ro.observe(el);
    // Initial measurement
    setSidebarWidth(el.clientWidth);

    return () => ro.disconnect();
  }, []);

  // cv-bugfix-thumbnail-rendering AC-5: Dynamic overlay scale from sidebar width
  // The thumbnail wrapper has padding (--space-2 = 8px each side from .thumbnail-card padding,
  // plus --space-1 = 4px from .thumbnail-card gap), so approximate the actual thumbnail width.
  // The wrapper is inside: sidebar (180px) - scroll padding (8px*2) - card padding (4px*2) - card border (2px*2)
  const overlayScale = sidebarWidth > 0 ? (sidebarWidth - 12) / 1920 : 0.08;

  // AC-4: Auto-scroll to keep active thumbnail visible
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated
    const scrollTimeout = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        const activeThumb = scrollContainerRef.current.querySelector(
          '.thumbnail-card--active'
        ) as HTMLElement;

        if (activeThumb) {
          activeThumb.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }
    });

    return () => cancelAnimationFrame(scrollTimeout);
  }, [currentSlide]);

  // v2-2-1 AC-5,6: Build className with collapsed state
  const sidebarClassName = collapsed
    ? 'thumbnail-sidebar thumbnail-sidebar--collapsed'
    : 'thumbnail-sidebar';

  return (
    <aside
      className={sidebarClassName}
      aria-label="Slide thumbnails"
      role="navigation"
      aria-hidden={collapsed}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div
            ref={scrollContainerRef}
            className="thumbnail-sidebar__scroll"
          >
            {slides.map((slide) => (
              <div
                key={slide.number}
                ref={slide.number === currentSlide ? activeThumbRef : undefined}
              >
                <ThumbnailCard
                  sortableId={`slide-${slide.number}`}
                  slideNumber={slide.number}
                  slideHtml={slide.html}
                  isActive={slide.number === currentSlide}
                  onClick={() => onNavigate(slide.number)}
                  reorderEnabled={isReorderEnabled}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {/* v2-4-1 AC-1: DragOverlay for lifted thumbnail appearance */}
        {/* cv-bugfix-thumbnail-rendering AC-5: Dynamic scale instead of hardcoded scale(0.08) */}
        {/* cv-bugfix-thumbnail-rendering: Shadow DOM for CSS-correct overlay rendering */}
        <DragOverlay>
          {activeSlide && (
            <div className="thumbnail-card thumbnail-card--overlay">
              <div className="thumbnail-card__wrapper">
                <OverlayPreview
                  html={activeSlide.html}
                  scale={overlayScale}
                />
              </div>
              <span className="thumbnail-card__number">{activeSlide.number}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </aside>
  );
}
