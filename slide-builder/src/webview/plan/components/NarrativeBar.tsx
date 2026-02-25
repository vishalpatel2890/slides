/**
 * NarrativeBar - Storyline flow visualization component.
 *
 * Story Reference: 19-3 Task 2 - Create NarrativeBar Component
 * AC-19.3.3: NarrativeBar displays storyline as horizontal flow: Hook, Tension, Resolution, CTA
 *            with corresponding values from storyline object.
 * AC-19.3.4: Narrative flow elements connected by arrow separators (→).
 * AC-19.3.5: NarrativeBar is scrollable on overflow (for narrow panes).
 *
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Storyline } from '../../../shared/types';

// =============================================================================
// Props Interface
// =============================================================================

export interface NarrativeBarProps {
  /** Storyline object with hook, tension, resolution, call_to_action */
  storyline: Storyline;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Narrative segments in display order.
 * Maps storyline object keys to display labels.
 */
const NARRATIVE_SEGMENTS = [
  { key: 'opening_hook', label: 'Hook' },
  { key: 'tension', label: 'Tension' },
  { key: 'resolution', label: 'Resolution' },
  { key: 'call_to_action', label: 'CTA' },
] as const;

type StorylineKey = (typeof NARRATIVE_SEGMENTS)[number]['key'];

// =============================================================================
// Component
// =============================================================================

/**
 * NarrativeBar displays the deck's storyline as a horizontal flow visualization.
 * Shows Hook → Tension → Resolution → CTA with arrow separators.
 *
 * @example
 * <NarrativeBar
 *   storyline={{
 *     opening_hook: "Start with impact",
 *     tension: "The challenge we face",
 *     resolution: "Our solution approach",
 *     call_to_action: "Take action now"
 *   }}
 * />
 */
export function NarrativeBar({
  storyline,
  className,
}: NarrativeBarProps): React.ReactElement {
  return (
    <div
      className={cn(
        // Base layout - AC-19.3.5: Scrollable on overflow
        'flex items-center gap-4',
        // Padding - consistent with TopBar
        'px-6 py-3',
        // AC-19.3.5: Horizontal scroll on overflow
        'overflow-x-auto whitespace-nowrap',
        // Background and border
        'bg-[var(--surface)] border-b border-[var(--border)]',
        // Hide scrollbar but maintain functionality
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[var(--border)]',
        className
      )}
      role="region"
      aria-label="Narrative flow"
    >
      {NARRATIVE_SEGMENTS.map((segment, index) => (
        <React.Fragment key={segment.key}>
          {/* AC-19.3.4: Arrow separator between segments */}
          {index > 0 && (
            <ArrowRight
              className="w-4 h-4 text-[var(--fg-secondary)]/50 flex-shrink-0"
              aria-hidden="true"
            />
          )}

          {/* Narrative segment */}
          <div className="flex flex-col min-w-0 flex-shrink-0">
            {/* Label - caption size, muted */}
            <span
              className={cn(
                'text-[11px] font-medium uppercase tracking-wide',
                'text-[var(--fg-secondary)]'
              )}
            >
              {segment.label}
            </span>

            {/* Value - body text, truncated with placeholder for empty */}
            <span
              className={cn(
                'text-sm text-[var(--fg)]',
                'truncate max-w-[200px]'
              )}
              title={storyline?.[segment.key as StorylineKey] || ''}
            >
              {storyline?.[segment.key as StorylineKey] || '—'}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

NarrativeBar.displayName = 'NarrativeBar';
