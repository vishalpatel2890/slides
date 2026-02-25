/**
 * TemplateSelector - Dropdown with confidence-scored template list.
 *
 * Story Reference: 20-2 Task 3, Task 4 - TemplateSelector with accessibility
 * Architecture Reference: notes/architecture/architecture.md#React Component Pattern
 *
 * AC-20.2.1: EditPanel template field opens TemplateSelector dropdown (Radix Popover)
 * AC-20.2.2: Shows all templates from catalog
 * AC-20.2.3: Each template shows name, description (truncated), ConfidenceScore badge
 * AC-20.2.5: Templates sorted by confidence score descending
 * AC-20.2.11: ARIA role="listbox", aria-activedescendant, keyboard navigation
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { ConfidenceScore } from './ConfidenceScore';
import type { TemplateCatalogEntry, TemplateScore } from '../../../shared/types';

// =============================================================================
// Props Interface
// =============================================================================

export interface TemplateSelectorProps {
  /** Currently selected template ID */
  currentTemplate: string;
  /** All templates from catalog */
  templates: TemplateCatalogEntry[];
  /** Confidence scores for each template (sorted by score desc) */
  scores: TemplateScore[];
  /** Callback when a template is selected */
  onSelect: (templateId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TemplateSelector displays a popover dropdown with confidence-ranked templates.
 *
 * @example
 * <TemplateSelector
 *   currentTemplate="content-slide"
 *   templates={catalog}
 *   scores={confidenceScores}
 *   onSelect={(id) => handleEdit('template', id)}
 * />
 */
export function TemplateSelector({
  currentTemplate,
  templates,
  scores,
  onSelect,
  className,
}: TemplateSelectorProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // AC-20.2.5: Sort templates by score descending, merging with catalog data
  const sortedItems = useMemo(() => {
    if (scores.length > 0) {
      // Scores are already sorted by confidence descending
      return scores;
    }
    // Fallback: show templates unsorted if no scores available
    return templates.map((t) => ({
      templateId: t.id,
      templateName: t.name,
      score: 0,
      tier: 'low' as const,
      description: t.description,
    }));
  }, [scores, templates]);

  // Find display name for current template
  const currentName = useMemo(() => {
    const found = templates.find((t) => t.id === currentTemplate);
    return found?.name || currentTemplate || 'Select template...';
  }, [templates, currentTemplate]);

  // Find current template's score
  const currentScore = useMemo(() => {
    return scores.find((s) => s.templateId === currentTemplate);
  }, [scores, currentTemplate]);

  // AC-20.2.11: Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < sortedItems.length - 1 ? prev + 1 : 0
          );
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : sortedItems.length - 1
          );
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < sortedItems.length) {
            onSelect(sortedItems[activeIndex].templateId);
            setOpen(false);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setOpen(false);
          break;
        }
      }
    },
    [activeIndex, sortedItems, onSelect]
  );

  // Scroll active item into view
  const scrollToActive = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView?.({ block: 'nearest' });
  }, []);

  // Update scroll position when active index changes
  React.useEffect(() => {
    if (activeIndex >= 0) {
      scrollToActive(activeIndex);
    }
  }, [activeIndex, scrollToActive]);

  // Reset active index when popover opens
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setActiveIndex(-1);
    }
  }, []);

  const activeDescendant =
    activeIndex >= 0 ? `template-option-${sortedItems[activeIndex]?.templateId}` : undefined;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      {/* Trigger button styled like other EditPanel fields */}
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full px-3 py-2',
            'text-[13px] text-[var(--fg)] text-left',
            'bg-[var(--bg)] border border-[var(--border)]',
            'rounded-[var(--radius-sm)]',
            'flex items-center justify-between gap-2',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
            'transition-shadow duration-150',
            className
          )}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate">{currentName}</span>
            {currentScore && (
              <ConfidenceScore score={currentScore.score} size="sm" />
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[var(--fg-muted)] flex-shrink-0 transition-transform duration-150',
              open && 'rotate-180'
            )}
          />
        </button>
      </Popover.Trigger>

      {/* Dropdown content */}
      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)]',
            'max-h-[300px] overflow-y-auto',
            'bg-[var(--card)] border border-[var(--border)]',
            'rounded-[var(--radius-sm)]',
            'shadow-lg',
            'animate-in fade-in-0 zoom-in-95',
            'p-1'
          )}
          side="bottom"
          align="start"
          sideOffset={4}
          onKeyDown={handleKeyDown}
        >
          {/* AC-20.2.11: role="listbox" for accessibility */}
          <div
            ref={listRef}
            role="listbox"
            aria-label="Select template"
            aria-activedescendant={activeDescendant}
          >
            {sortedItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-[var(--fg-muted)]">
                No templates available
              </div>
            ) : (
              sortedItems.map((item, index) => (
                <div
                  key={item.templateId}
                  id={`template-option-${item.templateId}`}
                  role="option"
                  aria-selected={item.templateId === currentTemplate}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2.5',
                    'rounded-[var(--radius-xs)]',
                    'cursor-pointer select-none',
                    'transition-colors duration-100',
                    // Highlight active item (keyboard) or hover
                    index === activeIndex
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'hover:bg-[var(--surface)]',
                    // Mark currently selected template
                    item.templateId === currentTemplate &&
                      index !== activeIndex &&
                      'bg-[var(--surface)]/50'
                  )}
                  onClick={() => {
                    onSelect(item.templateId);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {/* Template info */}
                  <div className="flex-1 min-w-0">
                    {/* AC-20.2.3: Template name (13px, 500 weight) */}
                    <div className="text-[13px] font-medium text-[var(--fg)] leading-tight">
                      {item.templateName}
                    </div>
                    {/* AC-20.2.3: Description (11px, muted, truncated 2 lines) */}
                    <div className="text-[11px] text-[var(--fg-muted)] leading-snug mt-0.5 line-clamp-2">
                      {item.description}
                    </div>
                  </div>
                  {/* AC-20.2.3: Confidence score badge */}
                  <ConfidenceScore score={item.score} size="md" className="flex-shrink-0 mt-0.5" />
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
