/**
 * SlideContextMenu - Context menu for slide card actions.
 *
 * Story Reference: 21-3 Task 4 - SlideContextMenu component with "Move to section"
 * AC-21.3.8: Context menu available via right-click or Shift+F10
 *
 * Uses Radix DropdownMenu with a "Move to section" submenu listing all sections
 * except the slide's current section. Triggered by right-click (onContextMenu)
 * and Shift+F10 (keyboard accessible).
 */

import React, { useState, useCallback, useRef } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '../lib/utils';
import type { SlideEntry, AgendaSection } from '../../../shared/types';

// =============================================================================
// Props Interface
// =============================================================================

export interface SlideContextMenuProps {
  /** The slide this menu is attached to */
  slide: SlideEntry;
  /** All available agenda sections */
  sections: AgendaSection[];
  /** Callback when user selects a section to move the slide to */
  onMoveToSection: (sectionId: string) => void;
  /** The wrapped slide card element */
  children: React.ReactNode;
}

// =============================================================================
// SlideContextMenu Component
// =============================================================================

export function SlideContextMenu({
  slide,
  sections,
  onMoveToSection,
  children,
}: SlideContextMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Filter out the slide's current section from the list
  const availableSections = sections.filter((s) => s.id !== slide.agenda_section_id);

  // Handle right-click to open the context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setOpen(true);
    },
    []
  );

  // Handle Shift+F10 to open the context menu via keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'F10' && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    },
    []
  );

  const handleMoveToSection = useCallback(
    (sectionId: string) => {
      onMoveToSection(sectionId);
      setOpen(false);
    },
    [onMoveToSection]
  );

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      {/* Hidden trigger button for Radix anchor positioning */}
      <DropdownMenu.Trigger asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={`Context menu for slide ${slide.number}`}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
          tabIndex={-1}
        />
      </DropdownMenu.Trigger>

      {/* Visible card wrapper that handles context menu and keyboard events */}
      <div
        ref={wrapperRef}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        style={{ display: 'contents' }}
      >
        {children}
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'min-w-[180px] rounded-lg p-1.5',
            'bg-[var(--card)] border border-[var(--border)]',
            'shadow-lg',
            'z-50'
          )}
          sideOffset={5}
          align="start"
        >
          {availableSections.length > 0 ? (
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md',
                  'text-[13px] text-[var(--fg)]',
                  'cursor-pointer select-none',
                  'data-[highlighted]:bg-[var(--primary-light)]',
                  'data-[highlighted]:text-[var(--primary)]',
                  'min-h-[36px]' // AC-21.3.11: minimum 36px touch target
                )}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
                <span>Move to section</span>
                <svg
                  className="ml-auto w-3.5 h-3.5 text-[var(--fg-muted)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </DropdownMenu.SubTrigger>

              <DropdownMenu.Portal>
                <DropdownMenu.SubContent
                  className={cn(
                    'min-w-[160px] rounded-lg p-1.5',
                    'bg-[var(--card)] border border-[var(--border)]',
                    'shadow-lg',
                    'z-50'
                  )}
                  sideOffset={4}
                >
                  {availableSections.map((section) => (
                    <DropdownMenu.Item
                      key={section.id}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md',
                        'text-[13px] text-[var(--fg)]',
                        'cursor-pointer select-none',
                        'data-[highlighted]:bg-[var(--primary-light)]',
                        'data-[highlighted]:text-[var(--primary)]',
                        'min-h-[36px]' // AC-21.3.11: minimum 36px touch target
                      )}
                      onSelect={() => handleMoveToSection(section.id)}
                    >
                      {section.title}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          ) : (
            <DropdownMenu.Item
              disabled
              className={cn(
                'flex items-center px-3 py-2 rounded-md',
                'text-[13px] text-[var(--fg-muted)]',
                'cursor-default select-none'
              )}
            >
              No other sections available
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
