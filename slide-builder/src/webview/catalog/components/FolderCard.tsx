/**
 * FolderCard - Visual card for a folder in the catalog grid.
 * Folders display with distinct styling and act as drop targets for decks.
 *
 * Story Reference: cv-3-3 AC-17, AC-18, AC-19, AC-21
 * Story Reference: cv-3-6 AC-1, AC-2, AC-3, AC-4, AC-5
 *
 * AC-17: Folder card with folder icon and deck count badge
 * AC-18: Drop target for deck drag-and-drop
 * AC-19: Visual feedback on drag hover (dashed border, primary tint)
 * AC-21: Inline rename on double-click
 * cv-3-6 AC-1: Double-click activates inline edit
 * cv-3-6 AC-2: Context menu with Rename option
 * cv-3-6 AC-5: Validation for invalid names
 */

import React, { useCallback, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Folder, Pencil, Trash2 } from 'lucide-react';
import type { FolderInfo } from '../../../shared/types';
import { InlineNameEdit } from './InlineNameEdit';
import { useIsNewFolder, useClearNewFolder, useCatalogFolders } from '../context/CatalogContext';
import { validateFolderName } from '../utils/validateFolderName';

export interface FolderCardProps {
  folder: FolderInfo;
  onClick?: (folderId: string) => void;
  onRename?: (folderId: string, newName: string) => void;
  onDelete?: (folder: FolderInfo) => void;
  /** Start in edit mode (for newly created folders) */
  startEditing?: boolean;
}

export function FolderCard({
  folder,
  onClick,
  onRename,
  onDelete,
  startEditing = false,
}: FolderCardProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(startEditing);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isNew = useIsNewFolder(folder.id);
  const clearNewFolder = useClearNewFolder();
  const allFolders = useCatalogFolders();

  // Build list of existing folder names for duplicate validation
  const existingFolderNames = allFolders.map((f) => f.name);

  // @dnd-kit drop target (AC-18, AC-19)
  const { setNodeRef, isOver, active } = useDroppable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id },
  });

  const handleClick = useCallback(() => {
    if (!isEditing) {
      onClick?.(folder.id);
    }
  }, [onClick, folder.id, isEditing]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isEditing) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.(folder.id);
      }
    },
    [onClick, folder.id, isEditing],
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setValidationError(null);
    setIsEditing(true);
  }, []);

  // cv-3-6 AC-2: Context menu Rename triggers inline edit
  const handleContextRename = useCallback(() => {
    setValidationError(null);
    setIsEditing(true);
  }, []);

  // cv-3-6 AC-2: Context menu Delete
  const handleContextDelete = useCallback(() => {
    onDelete?.(folder);
  }, [onDelete, folder]);

  // cv-3-6 AC-3, AC-5: Validate and save rename
  const handleRename = useCallback(
    (newName: string) => {
      const error = validateFolderName(newName, existingFolderNames, folder.name);
      if (error) {
        setValidationError(error);
        return;
      }
      setIsEditing(false);
      setValidationError(null);
      if (newName !== folder.name) {
        onRename?.(folder.id, newName);
      }
    },
    [onRename, folder.id, folder.name, existingFolderNames],
  );

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setValidationError(null);
  }, []);

  // Clear new folder animation status (cv-3-3)
  const handleAnimationEnd = useCallback(() => {
    if (isNew) {
      clearNewFolder(folder.id);
    }
  }, [isNew, clearNewFolder, folder.id]);

  // Determine if a deck is being dragged (for visual feedback)
  const isDeckBeingDragged = active?.data?.current?.type === 'deck';
  const showDropHighlight = isOver && isDeckBeingDragged;

  const deckLabel = `${folder.deckCount} deck${folder.deckCount !== 1 ? 's' : ''}`;
  const cardClassName = [
    'folder-card',
    showDropHighlight ? 'folder-card--drop-active' : '',
    isNew ? 'folder-card--entering' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const cardContent = (
    <div
      ref={setNodeRef}
      className={cardClassName}
      role="button"
      tabIndex={0}
      aria-label={`Folder: ${folder.name}, ${deckLabel}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDoubleClick={handleDoubleClick}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="folder-card__thumbnail">
        <Folder className="folder-card__icon" size={48} />
      </div>
      <div className="folder-card__body">
        {isEditing ? (
          <div className="folder-card__edit-container">
            <InlineNameEdit
              initialValue={folder.name}
              onSave={handleRename}
              onCancel={handleCancelEdit}
              autoFocus
            />
            {validationError && (
              <p className="folder-card__validation-error" role="alert">
                {validationError}
              </p>
            )}
          </div>
        ) : (
          <p className="folder-card__name">{folder.name}</p>
        )}
        <div className="folder-card__meta">
          <span className="folder-card__count">{deckLabel}</span>
        </div>
      </div>
    </div>
  );

  // cv-3-6 AC-2: Wrap with Radix context menu (follows DeckCard pattern)
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {cardContent}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="deck-context-menu">
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleClick}>
            Open
          </ContextMenu.Item>
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleContextRename}>
            <Pencil size={14} style={{ marginRight: '8px' }} />
            Rename
          </ContextMenu.Item>
          <ContextMenu.Separator className="deck-context-menu__separator" />
          <ContextMenu.Item className="deck-context-menu__item deck-context-menu__item--destructive" onSelect={handleContextDelete}>
            <Trash2 size={14} style={{ marginRight: '8px' }} />
            Delete Folder
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
