/**
 * DeckCard - Visual card for a single deck in the catalog grid.
 *
 * Story Reference: cv-1-4 Task 4 — DeckCard component
 * Story Reference: cv-1-6 Task 5 — Context menu (AC-7)
 * Story Reference: cv-3-2 Task 2 — Duplicate and Delete menu items
 * Story Reference: cv-3-3 Task 6 — Draggable for folder organization
 *
 * AC-1: Card anatomy: thumbnail (16:9), name, slide count, StatusDot.
 * AC-2: Hover lift + shadow, keyboard accessible (role="button", Enter/Space).
 * AC-7: Comprehensive ARIA label.
 * AC-8: prefers-reduced-motion disables hover lift and transitions.
 * AC-10: Click dispatches NAVIGATE_TO_DECK.
 * cv-1-6 AC-7: Right-click context menu with Open, Present, Duplicate, Delete, Edit Plan.
 * cv-3-2 AC-1: Duplicate and Delete enabled with icons.
 * cv-3-3 AC-18: Draggable for folder organization.
 * cv-3-7 AC-1: "Move to Folder..." context menu item.
 */

import React, { useCallback, useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Check, Copy, FolderInput, Pencil, Trash2 } from 'lucide-react';
import type { DeckInfo } from '../../../shared/types';
import { ThumbnailSkeleton } from './ThumbnailSkeleton';
import { ThumbnailPlaceholder, getDeckInitials } from './ThumbnailPlaceholder';
import { StatusDot } from './StatusDot';
import { useIsNewDeck, useClearNewDeck, useCatalogFolders } from '../context/CatalogContext';
import { FolderPickerDialog } from './FolderPickerDialog';
import { useLazyThumbnail } from '../hooks/useLazyThumbnail';

export interface DeckCardProps {
  deck: DeckInfo;
  onClick?: (deckId: string) => void;
  onEditPlan?: (deckId: string) => void;
  onDuplicate?: (deckId: string) => void;
  onRename?: (deck: DeckInfo) => void;
  onDelete?: (deck: DeckInfo) => void;
  /** Enable drag-and-drop for folder organization (cv-3-3 AC-18) */
  isDraggable?: boolean;
  /** cv-5-4 AC-27: Whether this card is selected for bulk operations */
  isSelected?: boolean;
  /** cv-5-4 AC-27: Handler for selection click with modifier keys */
  onSelectionClick?: (deckId: string, event: React.MouseEvent) => void;
}

export function DeckCard({ deck, onClick, onEditPlan, onDuplicate, onRename, onDelete, isDraggable = false, isSelected = false, onSelectionClick }: DeckCardProps): React.ReactElement {
  const isNew = useIsNewDeck(deck.id);
  const clearNewDeck = useClearNewDeck();
  const folders = useCatalogFolders();
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const contextMenuActionRef = useRef(false);

  // cv-5-3 AC-21: Lazy thumbnail loading via IntersectionObserver
  const { ref: thumbnailRef, isLoading, thumbnailUri, error } = useLazyThumbnail(
    deck.id,
    deck.firstSlidePath
  );

  // cv-3-3 AC-18: Draggable hook for folder organization
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `deck-${deck.id}`,
    data: { type: 'deck', deckId: deck.id },
    disabled: !isDraggable,
  });

  const dragStyle = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }
    : undefined;

  // cv-5-4 AC-27: Handle click with selection support
  // Normal click = drill down, Cmd/Ctrl+click = select, Shift+click = range select
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Guard: skip navigation when a context menu action was just selected
    if (contextMenuActionRef.current) {
      contextMenuActionRef.current = false;
      return;
    }
    // Cmd/Ctrl+click or Shift+click = handle selection
    if (onSelectionClick && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      onSelectionClick(deck.id, event);
      return;
    }
    // Normal click = drill down into deck
    onClick?.(deck.id);
  }, [onSelectionClick, onClick, deck.id]);

  // Clear new deck status after animation ends (cv-3-1 AC-5)
  const handleAnimationEnd = useCallback(() => {
    if (isNew) {
      clearNewDeck(deck.id);
    }
  }, [isNew, clearNewDeck, deck.id]);

  // cv-5-4 AC-27: Add selected class for visual feedback
  const cardClassName = [
    'deck-card',
    isNew ? 'deck-card--entering' : '',
    isDragging ? 'deck-card--dragging' : '',
    isSelected ? 'deck-card--selected' : '',
  ].filter(Boolean).join(' ');

  // cv-5-4 AC-27: Keyboard support - Enter/Space to drill down (or select with modifiers)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // If modifier keys, treat as selection toggle/range
        if (onSelectionClick && (e.shiftKey || e.ctrlKey || e.metaKey)) {
          onSelectionClick(deck.id, {
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            metaKey: e.metaKey,
          } as React.MouseEvent);
          return;
        }
        // Enter/Space without modifiers = drill down (like double-click)
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

  // cv-3-2: Duplicate handler
  const handleDuplicate = useCallback(() => {
    contextMenuActionRef.current = true;
    onDuplicate?.(deck.id);
  }, [onDuplicate, deck.id]);

  // cv-3-2: Delete handler - pass full deck info for confirmation dialog
  const handleDelete = useCallback(() => {
    contextMenuActionRef.current = true;
    onDelete?.(deck);
  }, [onDelete, deck]);

  // rename-deck-2 AC-1: Rename handler
  const handleRename = useCallback(() => {
    contextMenuActionRef.current = true;
    onRename?.(deck);
  }, [onRename, deck]);

  // cv-3-7 AC-1: Move to Folder handler
  const handleMoveToFolder = useCallback(() => {
    contextMenuActionRef.current = true;
    setMoveDialogOpen(true);
  }, []);

  // cv-3-7: Show "Move to Folder..." when there are folders to move to OR deck is in a folder (can move to root)
  const showMoveOption = folders.length > 0 || deck.folderId !== undefined;

  const slideLabel = `${deck.slideCount} slide${deck.slideCount !== 1 ? 's' : ''}`;

  return (
    <>
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={setNodeRef}
          className={cardClassName}
          role="button"
          tabIndex={0}
          aria-label={`Deck: ${deck.name}, ${slideLabel}, status: ${deck.status}${isSelected ? ', selected' : ''}`}
          aria-selected={isSelected}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onAnimationEnd={handleAnimationEnd}
          style={dragStyle}
          {...(isDraggable ? { ...listeners, ...attributes } : {})}
        >
          {/* cv-5-3: Thumbnail area with lazy loading */}
          <div className="deck-card__thumbnail" ref={thumbnailRef}>
            {isLoading && <ThumbnailSkeleton />}
            {!isLoading && thumbnailUri && (
              <img
                src={thumbnailUri}
                alt=""
                className="deck-card__thumbnail-image"
                draggable={false}
              />
            )}
            {!isLoading && !thumbnailUri && (
              <ThumbnailPlaceholder label={getDeckInitials(deck.name)} />
            )}
            {/* cv-5-4 AC-27: Selection checkbox overlay */}
            {isSelected && (
              <div className="deck-card__selection-checkbox" aria-hidden="true">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
          </div>
          <div className="deck-card__body">
            <p className="deck-card__name">{deck.name}</p>
            <div className="deck-card__meta">
              <span className="deck-card__count">{slideLabel}</span>
              <StatusDot status={deck.status} />
            </div>
          </div>
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="deck-context-menu">
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleOpen}>
            Open
          </ContextMenu.Item>
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleEditPlan}>
            Edit Plan
          </ContextMenu.Item>
          <ContextMenu.Separator className="deck-context-menu__separator" />
          <ContextMenu.Item className="deck-context-menu__item deck-context-menu__item--disabled" disabled>
            Present
          </ContextMenu.Item>
          {/* cv-3-2 AC-1, AC-2: Duplicate deck */}
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleDuplicate}>
            <Copy size={14} style={{ marginRight: '8px' }} />
            Duplicate
          </ContextMenu.Item>
          {/* rename-deck-2 AC-1: Rename deck */}
          <ContextMenu.Item className="deck-context-menu__item" onSelect={handleRename}>
            <Pencil size={14} style={{ marginRight: '8px' }} />
            Rename
          </ContextMenu.Item>
          {/* cv-3-7 AC-1: Move to Folder (opens folder picker dialog) */}
          {showMoveOption && (
            <ContextMenu.Item className="deck-context-menu__item" onSelect={handleMoveToFolder}>
              <FolderInput size={14} style={{ marginRight: '8px' }} />
              Move to Folder…
            </ContextMenu.Item>
          )}
          {/* cv-3-2 AC-1, AC-4: Delete deck (opens confirmation dialog) */}
          <ContextMenu.Item className="deck-context-menu__item deck-context-menu__item--destructive" onSelect={handleDelete}>
            <Trash2 size={14} style={{ marginRight: '8px' }} />
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>

      {/* cv-3-7: Folder picker dialog for move operation */}
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
