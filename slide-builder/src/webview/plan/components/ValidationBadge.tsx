/**
 * ValidationBadge - Amber circular warning badge for slides with issues.
 *
 * Story Reference: 22-1 Task 5 - Create ValidationBadge component
 * AC-22.1.8: Amber circular "!" badge overlaid on card's top-right corner
 * AC-22.1.9: Amber styling: bg #fffbeb, border #fde68a, text #f59e0b
 * AC-22.1.13: aria-label with warning count
 */

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import type { ValidationWarning } from '../../../shared/types';

export interface ValidationBadgeProps {
  /** Warnings to display */
  warnings: ValidationWarning[];
  /** Click handler (typically dispatches SELECT_SLIDE) */
  onClick: () => void;
}

export function ValidationBadge({ warnings, onClick }: ValidationBadgeProps): React.ReactElement | null {
  if (warnings.length === 0) return null;

  const count = warnings.length;
  const label = `${count} warning${count !== 1 ? 's' : ''}`;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="absolute -top-1.5 -right-1.5 z-10 flex items-center justify-center w-5 h-5 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#f59e0b] text-[11px] font-bold leading-none cursor-pointer hover:bg-[#fef3c7] transition-colors"
            aria-label={label}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            !
          </button>
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
  );
}

ValidationBadge.displayName = 'ValidationBadge';
