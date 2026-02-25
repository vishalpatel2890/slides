/**
 * SectionHeader - Collapsible section header for agenda sections.
 *
 * Story Reference: 19-2 Task 1 - Create SectionHeader Component
 * Story Reference: 19-4 - Visual Polish - Bold typography with narrative phase accents
 * Story Reference: 21-2 Task 6 - Cross-section drop targeting
 * AC-19.2.2: Section title with strong visual presence, narrative role as subtitle
 * AC-19.2.4: Clicking section header toggles collapse with aria-expanded.
 * AC-19.2.6: Keyboard-accessible: Enter/Space to toggle.
 * AC-21.2.6: Cross-section drop target — section header highlights during drag
 *
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 */

import React, { forwardRef } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '../lib/utils';
import { sectionDropId } from '../hooks/useDragAndDrop';
import { useValidation } from '../hooks/useValidation';
import type { AgendaSection } from '../../../shared/types';

// =============================================================================
// Narrative Phase Mapping
// Maps narrative_role keywords to CSS phase classes for visual differentiation
// =============================================================================

type NarrativePhase = 'hook' | 'context' | 'evidence' | 'detail' | 'transition' | 'cta' | 'default';

/**
 * Determines the narrative phase from a section's narrative_role string.
 * Matches keywords in the role description to assign visual styling.
 */
function getNarrativePhase(narrativeRole: string | undefined): NarrativePhase {
  if (!narrativeRole) return 'default';

  const role = narrativeRole.toLowerCase();

  // Check for specific phase keywords
  if (role.includes('hook') || role.includes('attention') || role.includes('opening')) {
    return 'hook';
  }
  if (role.includes('context') || role.includes('background') || role.includes('scene') || role.includes('why')) {
    return 'context';
  }
  if (role.includes('evidence') || role.includes('proof') || role.includes('data') || role.includes('credib')) {
    return 'evidence';
  }
  if (role.includes('transition') || role.includes('bridge') || role.includes('pivot')) {
    return 'transition';
  }
  if (role.includes('cta') || role.includes('call to action') || role.includes('action') || role.includes('next step')) {
    return 'cta';
  }

  // Default to detail for supporting content
  return 'detail';
}

/**
 * Returns the CSS class for section phase styling (left-border accent + gradient background)
 */
function getPhaseClass(phase: NarrativePhase): string {
  const phaseClasses: Record<NarrativePhase, string> = {
    hook: 'section-phase-hook',
    context: 'section-phase-context',
    evidence: 'section-phase-evidence',
    detail: 'section-phase-detail',
    transition: 'section-phase-transition',
    cta: 'section-phase-cta',
    default: 'section-phase-default',
  };
  return phaseClasses[phase];
}

// =============================================================================
// Props Interface
// =============================================================================

export interface SectionHeaderProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The agenda section data */
  section: AgendaSection;
  /** Number of slides in this section */
  slideCount: number;
  /** Whether DnD is active (enables droppable target) */
  dndEnabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * SectionHeader displays a collapsible section header with title, narrative role,
 * and slide count badge. Designed to be used with Radix Accordion.Trigger's asChild.
 *
 * @example
 * <Accordion.Trigger asChild>
 *   <SectionHeader section={section} slideCount={5} />
 * </Accordion.Trigger>
 */
export const SectionHeader = forwardRef<HTMLButtonElement, SectionHeaderProps>(
  function SectionHeader(
    { section, slideCount, dndEnabled = false, className, ...props },
    ref
  ): React.ReactElement {
    // Determine narrative phase for visual styling
    const phase = getNarrativePhase(section.narrative_role);
    const phaseClass = getPhaseClass(phase);

    // AC-22.1.11: Section-level validation warnings
    const { sectionWarnings } = useValidation();
    const warnings = sectionWarnings(section.id);

    // @dnd-kit droppable for cross-section drag target (AC-21.2.6)
    const droppableId = sectionDropId(section.id);
    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: droppableId,
      disabled: !dndEnabled,
    });

    return (
      <div ref={setDropRef}>
        <button
          ref={ref}
          type="button"
          className={cn(
            // Base layout
            'flex w-full items-center justify-between',
            // Padding - comfortable spacing for breathing room
            'pl-4 pr-4 py-3',
            // Phase-based styling (left border accent only - enterprise clean)
            phaseClass,
            // No border radius - sharp edges for enterprise feel
            'rounded-none',
            // Focus visible ring for keyboard navigation
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
            // Hover state - subtle background
            'hover:bg-[var(--surface)]/60',
            // Transition
            'transition-colors duration-150',
            // Drop target highlight (AC-21.2.6): --primary-subtle (#f0f3ff)
            isOver && 'bg-[var(--primary-subtle,#f0f3ff)] ring-2 ring-[var(--primary)]/30',
            className
          )}
          {...props}
        >
          {/* Left section: Title and narrative role */}
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* Section Title - Clean, professional */}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-[13px] font-semibold',
                  'text-[var(--fg)]'
                )}
              >
                {section.title}
              </span>

              {/* AC-22.1.11: Section-level warning indicator */}
              {warnings.length > 0 && (
                <Tooltip.Provider delayDuration={200}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="inline-flex" aria-label={`${warnings.length} section warning${warnings.length !== 1 ? 's' : ''}`}>
                        <AlertTriangle className="w-3.5 h-3.5 text-[#f59e0b]" />
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="rounded-md px-3 py-1.5 text-xs bg-[var(--card)] border border-[var(--border)] shadow-md text-[var(--fg)] max-w-[240px]"
                        sideOffset={5}
                      >
                        {warnings[0].message}
                        <Tooltip.Arrow className="fill-[var(--card)]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              )}
            </div>

            {/* Narrative Role - descriptive subtitle */}
            {section.narrative_role && (
              <span className="text-[11px] text-[var(--fg-muted)] truncate">
                {section.narrative_role}
              </span>
            )}
          </div>

          {/* Right section: Slide count badge and chevron */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Drop target indicator during drag */}
            {isOver && (
              <span className="text-[10px] font-medium text-[var(--primary)] mr-1">
                Drop here
              </span>
            )}

            {/* Slide Count Badge - minimal */}
            <span
              className={cn(
                'inline-flex items-center justify-center',
                'min-w-[20px] h-[20px] px-1.5',
                'text-[11px] font-medium tabular-nums',
                'text-[var(--fg-muted)]'
              )}
            >
              {slideCount}
            </span>

            {/* Chevron Icon - rotates on collapse */}
            <ChevronDown
              className={cn(
                'h-5 w-5 text-[var(--fg-muted)]',
                // Rotation handled by data-state from Radix Accordion
                'transition-transform duration-200',
                // When accordion is closed, rotate chevron
                'group-data-[state=closed]:-rotate-90',
                // Ensure the icon can receive the data-state via parent
                '[[data-state=closed]_&]:-rotate-90'
              )}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';
