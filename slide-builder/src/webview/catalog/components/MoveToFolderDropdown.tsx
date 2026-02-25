/**
 * MoveToFolderDropdown - Folder picker dropdown for bulk move operations.
 *
 * Story Reference: cv-5-4 Task 8 — MoveToFolderDropdown component
 * AC-31: "Move to Folder" shows a folder picker dropdown
 *
 * Uses Radix DropdownMenu for folder selection.
 */

import React, { useState, useCallback } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Folder, FolderPlus, ChevronDown } from 'lucide-react';
import type { FolderInfo } from '../../../shared/types';

export interface MoveToFolderDropdownProps {
  /** List of available folders */
  folders: FolderInfo[];
  /** Called when a folder is selected */
  onSelectFolder: (folderId: string) => void;
  /** Called when "New Folder" is selected, with the new folder name */
  onCreateAndMove?: (folderName: string) => void;
  /** Whether the dropdown trigger is disabled */
  disabled?: boolean;
}

/**
 * MoveToFolderDropdown - Folder picker for bulk move operations.
 *
 * @example
 * ```tsx
 * <MoveToFolderDropdown
 *   folders={folders}
 *   onSelectFolder={handleMoveToFolder}
 *   onCreateAndMove={handleCreateAndMove}
 * />
 * ```
 */
export function MoveToFolderDropdown({
  folders,
  onSelectFolder,
  onCreateAndMove,
  disabled = false,
}: MoveToFolderDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectFolder = useCallback(
    (folderId: string) => {
      onSelectFolder(folderId);
      setIsOpen(false);
    },
    [onSelectFolder]
  );

  const handleNewFolder = useCallback(() => {
    // Prompt for folder name
    const folderName = window.prompt('Enter folder name:');
    if (folderName?.trim() && onCreateAndMove) {
      onCreateAndMove(folderName.trim());
    }
    setIsOpen(false);
  }, [onCreateAndMove]);

  // Include "Root" option to move decks out of folders
  const showRootOption = true;

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="bulk-action-btn"
          disabled={disabled}
          aria-label="Move to folder"
        >
          <Folder size={14} />
          <span>Move to Folder</span>
          <ChevronDown size={12} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="deck-context-menu" sideOffset={4} align="end">
          {/* Root folder option */}
          {showRootOption && (
            <DropdownMenu.Item
              className="deck-context-menu__item"
              onSelect={() => handleSelectFolder('')}
            >
              <Folder size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
              Root (No Folder)
            </DropdownMenu.Item>
          )}

          {/* Existing folders */}
          {folders.map((folder) => (
            <DropdownMenu.Item
              key={folder.id}
              className="deck-context-menu__item"
              onSelect={() => handleSelectFolder(folder.id)}
            >
              <Folder size={14} style={{ marginRight: '8px' }} />
              {folder.name}
              <span style={{ marginLeft: 'auto', color: 'var(--fg-muted)', fontSize: '11px' }}>
                {folder.deckCount} {folder.deckCount === 1 ? 'deck' : 'decks'}
              </span>
            </DropdownMenu.Item>
          ))}

          {/* Separator before New Folder */}
          {(folders.length > 0 || showRootOption) && (
            <DropdownMenu.Separator className="deck-context-menu__separator" />
          )}

          {/* New Folder option */}
          {onCreateAndMove && (
            <DropdownMenu.Item
              className="deck-context-menu__item"
              onSelect={handleNewFolder}
            >
              <FolderPlus size={14} style={{ marginRight: '8px' }} />
              New Folder…
            </DropdownMenu.Item>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default MoveToFolderDropdown;
