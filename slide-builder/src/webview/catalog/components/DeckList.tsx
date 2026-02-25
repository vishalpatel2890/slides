/**
 * DeckList - List view for deck and folder cards with context menus and kebab menus.
 *
 * Story Reference: v3-2-2 Task 5 — DeckList component
 *
 * AC-1: Right-click context menu with same options as Grid view
 * AC-3: Kebab dropdown menu with same options as Grid view
 * AC-5: All Grid operations available and functional in List view
 * AC-7: Folder context menus (Open, Rename, Delete)
 * AC-8: Multi-select (Cmd/Ctrl+Click, Shift+Click)
 */

import React, { useCallback, useRef, useState } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Copy,
  FolderInput,
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
} from 'lucide-react';
import type { DeckInfo, FolderInfo } from '../../../shared/types';
import { StatusDot } from './StatusDot';
import { useSelection } from '../hooks/useSelection';
import { useCatalogFolders, useIsNewFolder, useClearNewFolder } from '../context/CatalogContext';
import { FolderPickerDialog } from './FolderPickerDialog';
import { RenameDeckDialog } from './RenameDeckDialog';
import { InlineNameEdit } from './InlineNameEdit';
import { validateFolderName } from '../utils/validateFolderName';
import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DeckListProps {
  decks: DeckInfo[];
  folders: FolderInfo[];
  onDeckClick: (deckId: string) => void;
  onFolderClick: (folderId: string) => void;
  onEditPlan?: (deckId: string) => void;
  onDuplicate?: (deckId: string) => void;
  onDelete?: (deck: DeckInfo) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folder: FolderInfo) => void;
  onMoveDeck?: (deckId: string, targetFolderId: string | undefined) => void;
  currentFolderId?: string;
}

// ---------------------------------------------------------------------------
// Folder List Row
// ---------------------------------------------------------------------------

function FolderListRow({
  folder,
  onClick,
  onRename,
  onDelete,
}: {
  folder: FolderInfo;
  onClick?: (folderId: string) => void;
  onRename?: (folderId: string, newName: string) => void;
  onDelete?: (folder: FolderInfo) => void;
}): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const allFolders = useCatalogFolders();
  const existingFolderNames = allFolders.map((f) => f.name);
  const isNew = useIsNewFolder(folder.id);
  const clearNewFolder = useClearNewFolder();

  const handleClick = useCallback(() => {
    if (!isEditing) onClick?.(folder.id);
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

  const handleRenameAction = useCallback(() => {
    setValidationError(null);
    setIsEditing(true);
  }, []);

  const handleDeleteAction = useCallback(() => {
    onDelete?.(folder);
  }, [onDelete, folder]);

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

  const handleAnimationEnd = useCallback(() => {
    if (isNew) clearNewFolder(folder.id);
  }, [isNew, clearNewFolder, folder.id]);

  const deckLabel = `${folder.deckCount} deck${folder.deckCount !== 1 ? 's' : ''}`;

  const rowContent = (
    <div
      className={`deck-list__row deck-list__row--folder${isNew ? ' deck-list__row--entering' : ''}`}
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onAnimationEnd={handleAnimationEnd}
      aria-label={`Folder: ${folder.name}, ${deckLabel}`}
    >
      <div className="deck-list__icon">
        <Folder size={16} />
      </div>
      <div className="deck-list__name deck-list__name--folder">
        {isEditing ? (
          <div className="deck-list__edit-container">
            <InlineNameEdit
              initialValue={folder.name}
              onSave={handleRename}
              onCancel={handleCancelEdit}
              autoFocus
            />
            {validationError && (
              <p className="deck-list__validation-error" role="alert">
                {validationError}
              </p>
            )}
          </div>
        ) : (
          folder.name
        )}
      </div>
      <span className="deck-list__count">{deckLabel}</span>
      <span className="deck-list__modified">{formatRelativeTime(folder.lastModified)}</span>
      {/* Kebab menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="deck-list__kebab"
            aria-label={`Actions for folder ${folder.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="deck-context-menu" sideOffset={4}>
            <DropdownMenu.Item className="deck-context-menu__item" onSelect={handleClick}>
              Open
            </DropdownMenu.Item>
            <DropdownMenu.Item className="deck-context-menu__item" onSelect={handleRenameAction}>
              <Pencil size={14} style={{ marginRight: '8px' }} />
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="deck-context-menu__separator" />
            <DropdownMenu.Item className="deck-context-menu__item deck-context-menu__item--destructive" onSelect={handleDeleteAction}>
              <Trash2 size={14} style={{ marginRight: '8px' }} />
              Delete Folder
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{rowContent}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="deck-context-menu">
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleClick}>
            Open
          </ContextMenu.Item>
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleRenameAction}>
            <Pencil size={14} style={{ marginRight: '8px' }} />
            Rename
          </ContextMenu.Item>
          <ContextMenu.Separator className="deck-context-menu__separator" />
          <ContextMenu.Item className="deck-context-menu__item deck-context-menu__item--destructive" onSelect={handleDeleteAction}>
            <Trash2 size={14} style={{ marginRight: '8px' }} />
            Delete Folder
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

// ---------------------------------------------------------------------------
// Deck List Row
// ---------------------------------------------------------------------------

function DeckListRow({
  deck,
  onClick,
  onEditPlan,
  onDuplicate,
  onRename,
  onDelete,
  isSelected,
  onSelectionClick,
  showMoveOption,
}: {
  deck: DeckInfo;
  onClick?: (deckId: string) => void;
  onEditPlan?: (deckId: string) => void;
  onDuplicate?: (deckId: string) => void;
  onRename?: (deck: DeckInfo) => void;
  onDelete?: (deck: DeckInfo) => void;
  isSelected: boolean;
  onSelectionClick?: (deckId: string, event: React.MouseEvent) => void;
  showMoveOption: boolean;
}): React.ReactElement {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const contextMenuActionRef = useRef(false);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      // Guard: skip navigation when a context menu action was just selected
      if (contextMenuActionRef.current) {
        contextMenuActionRef.current = false;
        return;
      }
      if (onSelectionClick && (event.shiftKey || event.ctrlKey || event.metaKey)) {
        onSelectionClick(deck.id, event);
        return;
      }
      onClick?.(deck.id);
    },
    [onSelectionClick, onClick, deck.id],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onSelectionClick && (e.shiftKey || e.ctrlKey || e.metaKey)) {
          onSelectionClick(deck.id, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey } as React.MouseEvent);
          return;
        }
        onClick?.(deck.id);
      }
    },
    [onClick, onSelectionClick, deck.id],
  );

  const handleOpen = useCallback(() => {
    contextMenuActionRef.current = true;
    onClick?.(deck.id);
  }, [onClick, deck.id]);
  const handleEditPlan = useCallback(() => {
    contextMenuActionRef.current = true;
    onEditPlan?.(deck.id);
  }, [onEditPlan, deck.id]);
  const handleDuplicate = useCallback(() => {
    contextMenuActionRef.current = true;
    onDuplicate?.(deck.id);
  }, [onDuplicate, deck.id]);
  const handleDelete = useCallback(() => {
    contextMenuActionRef.current = true;
    onDelete?.(deck);
  }, [onDelete, deck]);
  // rename-deck-2 AC-1: Rename handler
  const handleRename = useCallback(() => {
    contextMenuActionRef.current = true;
    onRename?.(deck);
  }, [onRename, deck]);
  const handleMoveToFolder = useCallback(() => {
    contextMenuActionRef.current = true;
    setMoveDialogOpen(true);
  }, []);

  const slideLabel = `${deck.slideCount} slide${deck.slideCount !== 1 ? 's' : ''}`;

  // Shared menu items rendered in both context menu and kebab dropdown
  const menuItemsJsx = (
    Component: typeof ContextMenu | typeof DropdownMenu,
  ) => (
    <>
      <Component.Item className="deck-context-menu__item" onSelect={handleOpen}>
        Open
      </Component.Item>
      <Component.Item className="deck-context-menu__item" onSelect={handleEditPlan}>
        Edit Plan
      </Component.Item>
      <Component.Separator className="deck-context-menu__separator" />
      <Component.Item className="deck-context-menu__item deck-context-menu__item--disabled" disabled>
        Present
      </Component.Item>
      <Component.Item className="deck-context-menu__item" onSelect={handleDuplicate}>
        <Copy size={14} style={{ marginRight: '8px' }} />
        Duplicate
      </Component.Item>
      {/* rename-deck-2 AC-1, AC-7: Rename deck */}
      <Component.Item className="deck-context-menu__item" onSelect={handleRename}>
        <Pencil size={14} style={{ marginRight: '8px' }} />
        Rename
      </Component.Item>
      {showMoveOption && (
        <Component.Item className="deck-context-menu__item" onSelect={handleMoveToFolder}>
          <FolderInput size={14} style={{ marginRight: '8px' }} />
          Move to Folder…
        </Component.Item>
      )}
      <Component.Item className="deck-context-menu__item deck-context-menu__item--destructive" onSelect={handleDelete}>
        <Trash2 size={14} style={{ marginRight: '8px' }} />
        Delete
      </Component.Item>
    </>
  );

  const rowContent = (
    <div
      className={`deck-list__row${isSelected ? ' deck-list__row--selected' : ''}`}
      role="listitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Deck: ${deck.name}, ${slideLabel}, status: ${deck.status}${isSelected ? ', selected' : ''}`}
      aria-selected={isSelected}
    >
      {/* Selection checkbox */}
      {isSelected && (
        <div className="deck-list__selection-checkbox" aria-hidden="true">
          <Check size={12} strokeWidth={3} />
        </div>
      )}
      <div className="deck-list__name">{deck.name}</div>
      <span className="deck-list__count">{slideLabel}</span>
      <StatusDot status={deck.status} />
      <span className="deck-list__modified">{formatRelativeTime(deck.lastModified)}</span>
      {/* Kebab menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="deck-list__kebab"
            aria-label={`Actions for deck ${deck.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="deck-context-menu" sideOffset={4}>
            {menuItemsJsx(DropdownMenu)}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>{rowContent}</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content className="deck-context-menu">
            {menuItemsJsx(ContextMenu)}
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>

      {/* Folder picker dialog for move operation */}
      <FolderPickerDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        deckId={deck.id}
        deckName={deck.name}
        currentFolderId={deck.folderId}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// DeckList (main component)
// ---------------------------------------------------------------------------

export function DeckList({
  decks,
  folders,
  onDeckClick,
  onFolderClick,
  onEditPlan,
  onDuplicate,
  onDelete,
  onFolderRename,
  onFolderDelete,
  onMoveDeck,
  currentFolderId,
}: DeckListProps): React.ReactElement {
  // Multi-select support (cv-5-4 pattern)
  const allDeckIds = useMemo(() => decks.map((d) => d.id), [decks]);
  const { isSelected, handleItemClick } = useSelection({ allIds: allDeckIds });

  // rename-deck-2 AC-2: Rename dialog state
  const [renameDeck, setRenameDeck] = useState<DeckInfo | null>(null);
  const existingDeckIds = useMemo(() => decks.map((d) => d.id), [decks]);
  const handleRenameRequest = useCallback((deck: DeckInfo) => {
    setRenameDeck(deck);
  }, []);

  const displayFolders = currentFolderId ? [] : folders;
  const showMoveOption = folders.length > 0;

  return (
    <>
      <div className="deck-list" role="list">
        {/* Folders first (root level only) */}
        {displayFolders.map((folder) => (
          <FolderListRow
            key={`folder-${folder.id}`}
            folder={folder}
            onClick={onFolderClick}
            onRename={onFolderRename}
            onDelete={onFolderDelete}
          />
        ))}
        {/* Decks */}
        {decks.map((deck) => (
          <DeckListRow
            key={deck.id}
            deck={deck}
            onClick={onDeckClick}
            onEditPlan={onEditPlan}
            onDuplicate={onDuplicate}
            onRename={handleRenameRequest}
            onDelete={onDelete}
            isSelected={isSelected(deck.id)}
            onSelectionClick={handleItemClick}
            showMoveOption={showMoveOption}
          />
        ))}
      </div>

      {/* rename-deck-2 AC-2: Rename dialog */}
      {renameDeck && (
        <RenameDeckDialog
          open={renameDeck !== null}
          onOpenChange={(open) => { if (!open) setRenameDeck(null); }}
          deck={renameDeck}
          existingDeckIds={existingDeckIds}
        />
      )}
    </>
  );
}
