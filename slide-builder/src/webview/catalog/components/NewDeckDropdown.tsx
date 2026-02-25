/**
 * NewDeckDropdown - "+ New" button with dropdown menu.
 *
 * Story Reference: cv-3-1 Task 1 — NewDeckDropdown component
 * Story Reference: cv-3-3 Task 8 — Add New Folder option
 *
 * AC-1: Shows Radix DropdownMenu with "Plan with AI" and "From Template" options.
 * AC-6: Keyboard accessible (arrow keys, Enter/Space, Escape).
 * cv-3-3 AC-16: "New Folder" option to create folders for deck organization.
 */

import React, { useCallback } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus, Wand2, LayoutTemplate, FolderPlus, FileText } from 'lucide-react';

export interface NewDeckDropdownProps {
  onPlanWithAI: () => void;
  onPlanSlideWithAI: () => void;
  onFromTemplate: () => void;
  /** cv-3-3 AC-16: Create new folder */
  onNewFolder?: () => void;
}

export function NewDeckDropdown({
  onPlanWithAI,
  onPlanSlideWithAI,
  onFromTemplate,
  onNewFolder,
}: NewDeckDropdownProps): React.ReactElement {
  const handlePlanWithAI = useCallback(() => {
    onPlanWithAI();
  }, [onPlanWithAI]);

  const handleFromTemplate = useCallback(() => {
    onFromTemplate();
  }, [onFromTemplate]);

  const handleNewFolder = useCallback(() => {
    onNewFolder?.();
  }, [onNewFolder]);

  const handlePlanSlideWithAI = useCallback(() => {
    onPlanSlideWithAI();
  }, [onPlanSlideWithAI]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="new-deck-btn"
          aria-label="Create new deck"
          type="button"
        >
          <Plus size={14} aria-hidden="true" />
          <span className="new-deck-btn__label">New</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="new-deck-menu"
          sideOffset={4}
          align="end"
        >
          <DropdownMenu.Item
            className="new-deck-menu__item"
            onSelect={handlePlanWithAI}
          >
            <Wand2 size={14} className="new-deck-menu__icon" aria-hidden="true" />
            <span>Plan Deck with AI</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="new-deck-menu__item"
            onSelect={handlePlanSlideWithAI}
          >
            <FileText size={14} className="new-deck-menu__icon" aria-hidden="true" />
            <span>Plan Slide with AI</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="new-deck-menu__item"
            onSelect={handleFromTemplate}
          >
            <LayoutTemplate size={14} className="new-deck-menu__icon" aria-hidden="true" />
            <span>From Template</span>
          </DropdownMenu.Item>
          {/* cv-3-3 AC-16: New Folder option */}
          {onNewFolder && (
            <>
              <DropdownMenu.Separator className="new-deck-menu__separator" />
              <DropdownMenu.Item
                className="new-deck-menu__item"
                onSelect={handleNewFolder}
              >
                <FolderPlus size={14} className="new-deck-menu__icon" aria-hidden="true" />
                <span>New Folder</span>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
