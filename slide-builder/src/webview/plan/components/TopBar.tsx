/**
 * TopBar - Deck metadata header component.
 *
 * Story Reference: 19-3 Task 1 - Create TopBar Component
 * AC-19.3.1: TopBar displays deck name (16px, 600 weight), audience description, purpose text.
 * AC-19.3.2: TopBar includes "Build All" button (outline style) - rendered as disabled placeholder.
 * AC-19.3.6: TopBar uses Inter font, VS Code-native feel.
 * AC-19.3.7: At narrow widths (<800px), deck header shows only deck name.
 *
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 */

import React from 'react';
import { AlertTriangle, Eye, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useValidation } from '../hooks/useValidation';
import type { AudienceContext, SlideEntry } from '../../../shared/types';

// =============================================================================
// Props Interface
// =============================================================================

export interface TopBarProps {
  /** The deck name */
  deckName: string;
  /** Audience context object */
  audience: AudienceContext;
  /** Purpose text */
  purpose: string;
  /** Optional callback when Build All is clicked (wired in Epic 22) */
  onBuildAll?: () => void;
  /** Optional callback when Edit w/ Claude is clicked (plan-level) */
  onOpenClaude?: () => void;
  /** Optional callback when View Slides is clicked (cv-2-5 AC-2) */
  onViewSlides?: () => void;
  /** Whether the deck has built slides (cv-2-5 AC-3) */
  hasBuiltSlides?: boolean;
  /** Slides array for computing build progress summary (BR-1.2 AC-8) */
  slides?: SlideEntry[];
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TopBar displays deck metadata: name, audience description, purpose,
 * and a Build All button (disabled placeholder for Epic 22).
 *
 * @example
 * <TopBar
 *   deckName="Q1 Strategy Presentation"
 *   audience={{ description: "Executive team", knowledge_level: "expert", priorities: [] }}
 *   purpose="Communicate strategic priorities"
 * />
 */
export function TopBar({
  deckName,
  audience,
  purpose,
  onBuildAll,
  onOpenClaude,
  onViewSlides,
  hasBuiltSlides,
  slides = [],
  className,
}: TopBarProps): React.ReactElement {
  // AC-22.1.12: Deck-level validation warnings
  const { deckWarnings } = useValidation();

  // BR-1.2 AC-8: Compute build progress from slides array
  const builtCount = slides.filter(s => s.status === 'built').length;
  const totalCount = slides.length;
  // BR-1.2 AC-10: Detect all-built state for optional success color
  const allBuilt = builtCount === totalCount && totalCount > 0;

  return (
    <>
      <div
        className={cn(
          // Base layout
          'flex items-center justify-between',
          // Padding - consistent horizontal padding, comfortable vertical
          'px-6 py-4',
          // Background and border - VS Code-native feel
          'bg-[var(--card)] border-b border-[var(--border)]',
          className
        )}
      >
        {/* Left section: Deck metadata */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Deck Name - AC-19.3.1: 16px, 600 weight */}
          <h1
            className={cn(
              'text-[16px] font-semibold text-[var(--fg)]',
              'truncate shrink-0'
            )}
          >
            {deckName}
          </h1>

          {/* Audience Description - AC-19.3.1, AC-19.3.7: hidden at <800px */}
          {audience?.description && (
            <span
              className={cn(
                'hidden md:block',
                'text-sm text-[var(--fg-secondary)]',
                'truncate'
              )}
            >
              {audience.description}
            </span>
          )}

          {/* Purpose Text - AC-19.3.1, AC-19.3.7: hidden at <800px */}
          {purpose && (
            <span
              className={cn(
                'hidden lg:block',
                'text-sm text-[var(--fg-secondary)]/70',
                'truncate'
              )}
            >
              {purpose}
            </span>
          )}

          {/* BR-1.2 AC-8, AC-9, AC-10, AC-12: Build progress summary */}
          <span
            className={cn(
              'hidden md:block',
              'text-sm whitespace-nowrap',
              allBuilt
                ? 'text-[var(--success,#22c55e)]'
                : 'text-[var(--fg-secondary)]'
            )}
            aria-label={`${builtCount} of ${totalCount} slides built`}
          >
            {builtCount}/{totalCount} slides built
          </span>
        </div>

        {/* Right section: Claude + Build All buttons */}
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {/* AC-1, AC-6: Plan-level Edit w/ Claude button */}
          {onOpenClaude && (
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5',
                'px-4 py-2',
                'text-sm font-medium',
                'bg-white border border-[var(--border)] rounded-sm',
                'text-[var(--fg)]',
                'hover:bg-[var(--surface)]'
              )}
              onClick={onOpenClaude}
              aria-label="Edit plan with Claude"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Edit w/ Claude</span>
            </button>
          )}

          {/* cv-2-5 AC-2, AC-3: View Slides button */}
          {onViewSlides && (
            <button
              type="button"
              className={cn(
                'flex items-center gap-1.5',
                'px-4 py-2',
                'text-sm font-medium',
                'bg-white border border-[var(--border)] rounded-sm',
                'text-[var(--fg)]',
                'hover:bg-[var(--surface)]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              onClick={onViewSlides}
              disabled={hasBuiltSlides === false}
              title={hasBuiltSlides === false ? 'Build slides first to preview them' : 'View slides in Slide Viewer'}
              aria-label="View slides"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">View Slides</span>
            </button>
          )}

          {/* AC-19.3.2, cv-3-4 AC-30: Build All button */}
          <button
            type="button"
            className={cn(
              'px-4 py-2',
              'text-sm font-medium',
              'bg-white border border-[var(--border)] rounded-sm',
              'text-[var(--fg)]',
              'hover:bg-[var(--surface)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            disabled={!onBuildAll}
            onClick={onBuildAll}
            aria-label="Build all slides via Claude Code"
            title="Build all slides via Claude Code"
          >
            Build All
          </button>
        </div>
      </div>

      {/* AC-22.1.12: Deck-level warning banner */}
      {deckWarnings.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 bg-[#fffbeb] border border-[#fde68a] text-[#f59e0b] text-sm rounded mx-6 mt-2"
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {deckWarnings[0].message}
          </span>
        </div>
      )}
    </>
  );
}

TopBar.displayName = 'TopBar';
