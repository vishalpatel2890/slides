/**
 * SlideCard - Outline-style card representation of a slide in the deck.
 *
 * Story Reference: 19-4 - UI Polish & Visual Refinements (Redesign)
 * Story Reference: 21-2 Task 3 - Drag handle and dragging states
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 *
 * Design: Clean outline layout with subtle visual hierarchy.
 * - Drag handle (GripVertical) appears on hover (progressive disclosure)
 * - Slide number as refined marker on left
 * - Intent as primary heading with clear visual weight
 * - Key points as elegant bulleted list
 * - Soft empty states that hint rather than warn
 *
 * AC-21.2.1: Drag handle progressive disclosure (opacity-0 → opacity-100 on hover)
 * AC-21.2.2: Card lift visual feedback (scale-95, shadow-lg, opacity-50)
 * AC-21.2.9: GPU-accelerated drag via CSS transforms (useSortable)
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { GripVertical, CheckCircle2, Circle, Hammer } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { getSlideIntent, getSlideTemplate, type SlideEntry } from '../../../shared/types';
import { slideNumberToId } from '../hooks/useDragAndDrop';
import { useValidation } from '../hooks/useValidation';
import { ValidationBadge } from './ValidationBadge';

// =============================================================================
// Card Variants using cva - Refined outline style
// AC-21.2.2: Added 'dragging' variant for card lift visual feedback
// =============================================================================

const cardVariants = cva(
  // Base styles - clean enterprise card design with sharp geometry
  [
    'group/card',
    'relative',
    'flex',
    'gap-4',
    'rounded-md',
    'bg-[var(--card)]',
    'border',
    'px-5',
    'py-4',
    'cursor-pointer',
    'transition-all',
    'duration-150',
    'ease-out',
  ],
  {
    variants: {
      state: {
        default: [
          'border-[var(--border)]',
          'shadow-sm',
          'hover:shadow-md',
          'hover:border-[var(--fg-muted)]/40',
          'hover:-translate-y-0.5',
        ],
        selected: [
          'border-[var(--primary)]',
          'shadow-md',
          'bg-[var(--primary-light)]/30',
        ],
        // Dragging state (AC-21.2.2): card lift visual feedback
        dragging: [
          'border-[var(--primary)]/50',
          'shadow-lg',
          'scale-95',
          'opacity-50',
        ],
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

// =============================================================================
// Props Interface
// =============================================================================

export interface SlideCardProps extends VariantProps<typeof cardVariants> {
  /** Slide data from the plan */
  slide: SlideEntry;
  /** Whether this card is currently selected */
  selected: boolean;
  /** Callback when card is selected */
  onSelect: (slideNumber: number) => void;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Callback when card receives focus */
  onFocus?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Animation delay index for staggered entrance (multiplied by 50ms) */
  animationIndex?: number;
  /** Whether DnD is enabled (disables sortable when false) */
  dndEnabled?: boolean;
  /** Callback when build button is clicked (BR-1.3 AC-14) */
  onBuild?: (slideNumber: number) => void;
}

// =============================================================================
// SlideCard Component - Outline Style with DnD Support
// =============================================================================

/**
 * SlideCard displays a slide as an outline-style card with number, title, and bullet points.
 * When dndEnabled is true, wraps with useSortable for drag-and-drop reordering.
 */
export function SlideCard({
  slide,
  selected,
  onSelect,
  tabIndex = 0,
  onFocus,
  className,
  animationIndex = 0,
  dndEnabled = false,
  onBuild,
}: SlideCardProps): React.ReactElement {
  const intent = getSlideIntent(slide);
  const keyPoints = slide.key_points ?? [];
  const hasIntent = intent.trim().length > 0;

  // AC-22.1.8: Validation badge overlay for slides with warnings
  const { slideWarnings } = useValidation();
  const warnings = slideWarnings(slide.number);

  // @dnd-kit sortable integration (AC-21.2.9, AC-21.2.12)
  const sortableId = slideNumberToId(slide.number);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    disabled: !dndEnabled,
  });

  // GPU-accelerated transform styles (AC-21.2.9)
  const sortableStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const cardState = isDragging ? 'dragging' : selected ? 'selected' : 'default';

  const handleClick = (): void => {
    if (!isDragging) {
      onSelect(slide.number);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(slide.number);
    }
  };

  const animationDelay = Math.min(animationIndex * 50, 500);

  return (
    <div
      {...attributes}
      ref={setNodeRef}
      role="gridcell"
      tabIndex={tabIndex}
      aria-selected={selected}
      aria-label={`Slide ${slide.number}: ${hasIntent ? intent : 'Untitled slide'}`}
      className={cn(
        cardVariants({ state: cardState }),
        'slide-card-stagger',
        className
      )}
      style={{
        animationDelay: `${animationDelay}ms`,
        ...sortableStyle,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={onFocus}
    >
      {/* AC-22.1.8: Validation badge overlay on card's top-right corner */}
      {warnings.length > 0 && (
        <ValidationBadge
          warnings={warnings}
          onClick={() => onSelect(slide.number)}
        />
      )}

      {/* BR-1.1 AC-1,2,3,4,5: Build status badge - positioned top-right inside card */}
      <div
        className={cn(
          'absolute top-2 z-10',
          warnings.length > 0 ? 'right-8' : 'right-2'
        )}
        aria-label={slide.status === 'built' ? 'Built' : 'Pending'}
      >
        {slide.status === 'built' ? (
          <CheckCircle2 className="w-4.5 h-4.5 text-[var(--success,#22c55e)]" />
        ) : (
          <Circle className="w-4.5 h-4.5 text-[var(--fg-muted)] opacity-60" />
        )}
      </div>

      {/* BR-1.3 AC-13,15,18: Build action button - progressive disclosure matching drag handle pattern */}
      <button
        type="button"
        className={cn(
          'absolute top-2 z-10',
          warnings.length > 0 ? 'right-14' : 'right-8',
          'flex items-center justify-center',
          'w-6 h-6 rounded',
          'opacity-0 group-hover/card:opacity-100',
          'transition-opacity duration-150',
          'text-[var(--fg-muted)] hover:text-[var(--fg)]',
          'cursor-pointer',
          'bg-transparent hover:bg-[var(--surface)]'
        )}
        aria-label={`Build slide ${slide.number}`}
        onClick={(e) => {
          e.stopPropagation();
          console.log('[SlideCard] Build button clicked for slide', slide.number, 'onBuild:', typeof onBuild);
          onBuild?.(slide.number);
        }}
      >
        <Hammer className="w-3.5 h-3.5" />
      </button>

      {/* Drag handle - progressive disclosure (AC-21.2.1) */}
      {dndEnabled && (
        <div
          className={cn(
            'absolute left-1 top-1/2 -translate-y-1/2',
            'flex items-center justify-center',
            'w-9 h-9 rounded',
            'cursor-grab active:cursor-grabbing',
            'opacity-0 group-hover/card:opacity-100',
            'transition-opacity duration-150',
            'text-[var(--fg-faint)] hover:text-[var(--fg-muted)]',
            isDragging && 'opacity-0'
          )}
          data-drag-handle
          aria-label={`Drag slide ${slide.number}`}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Left: Slide number */}
      <div className={cn('flex-shrink-0 w-6 pt-0.5', dndEnabled && 'ml-4')}>
        <span
          className={cn(
            'text-[13px] font-medium tabular-nums',
            selected
              ? 'text-[var(--primary)]'
              : 'text-[var(--fg-muted)]',
            'transition-colors duration-150'
          )}
        >
          {slide.number}
        </span>
      </div>

      {/* Right: Content with clear hierarchy */}
      <div className="flex-1 min-w-0">
        {hasIntent ? (
          <h3 className="text-[14px] font-medium text-[var(--fg)] leading-snug tracking-[-0.01em]">
            {intent}
          </h3>
        ) : (
          <h3 className="text-[14px] text-[var(--fg-faint)] leading-snug">
            Untitled slide
          </h3>
        )}

        {keyPoints.length > 0 ? (
          <ul className="mt-2 space-y-1.5">
            {keyPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-baseline gap-2.5 text-[13px] text-[var(--fg-secondary)] leading-relaxed"
              >
                <span
                  className={cn(
                    'flex-shrink-0 w-1 h-1 rounded-full mt-[0.5em]',
                    selected ? 'bg-[var(--primary)]/60' : 'bg-[var(--fg-faint)]'
                  )}
                  aria-hidden="true"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : hasIntent ? (
          <p className="mt-1.5 text-[12px] text-[var(--fg-faint)] italic">
            No key points yet
          </p>
        ) : null}

        {getSlideTemplate(slide) && (
          <div className="mt-3 pt-2 border-t border-[var(--border)]/50">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface)] text-[var(--fg-muted)] border border-[var(--border)]">
              {getSlideTemplate(slide)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
