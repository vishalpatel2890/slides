/**
 * DeckGrid - Responsive grid/list layout for deck cards with folder support.
 *
 * Story Reference: cv-1-4 Task 5 — DeckGrid component
 * Story Reference: cv-3-2 Task 2 — Pass duplicate/delete handlers
 * Story Reference: cv-3-3 — Folder cards and drag-and-drop
 * Story Reference: cv-5-5 Task 2 — Grid keyboard navigation via useGridKeyboard
 *
 * AC-1: Responsive grid with repeat(auto-fill, minmax(240px, 1fr)), 24px gap.
 * AC-4: Grid/list view toggle.
 * AC-9: Responsive columns by sidebar width.
 * AC-10: Card click dispatches NAVIGATE_TO_DECK.
 * cv-3-2: Pass onDuplicate and onDelete to DeckCard.
 * cv-3-3: Folder cards, drag-and-drop, folder drill-down navigation.
 * cv-5-5 AC-39: Arrow keys navigate between cards in the grid.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { RenameDeckDialog } from './RenameDeckDialog';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { DeckInfo, FolderInfo } from '../../../shared/types';
import { DeckCard } from './DeckCard';
import { FolderCard } from './FolderCard';
import { StatusDot } from './StatusDot';
import { useSelection } from '../hooks/useSelection';
import { useGridKeyboard } from '../hooks/useGridKeyboard';

export interface DeckGridProps {
  decks: DeckInfo[];
  folders: FolderInfo[];
  viewMode: 'grid' | 'list';
  onDeckClick: (deckId: string) => void;
  onFolderClick: (folderId: string) => void;
  onEditPlan?: (deckId: string) => void;
  onDuplicate?: (deckId: string) => void;
  onDelete?: (deck: DeckInfo) => void;
  onFolderRename?: (folderId: string, newName: string) => void;
  onFolderDelete?: (folder: FolderInfo) => void;
  onMoveDeck?: (deckId: string, targetFolderId: string | undefined) => void;
  /** Currently drilled-into folder (undefined = root level) */
  currentFolderId?: string;
}

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

export function DeckGrid({
  decks,
  folders,
  viewMode,
  onDeckClick,
  onFolderClick,
  onEditPlan,
  onDuplicate,
  onDelete,
  onFolderRename,
  onFolderDelete,
  onMoveDeck,
  currentFolderId,
}: DeckGridProps): React.ReactElement {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [activeDeck, setActiveDeck] = React.useState<DeckInfo | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // rename-deck-2 AC-2: Rename dialog state
  const [renameDeck, setRenameDeck] = useState<DeckInfo | null>(null);
  const existingDeckIds = useMemo(() => decks.map((d) => d.id), [decks]);
  const handleRenameRequest = useCallback((deck: DeckInfo) => {
    setRenameDeck(deck);
  }, []);
  const [columns, setColumns] = useState(3);

  // cv-5-4: Multi-select support for bulk operations
  const allDeckIds = useMemo(() => decks.map((d) => d.id), [decks]);
  const { isSelected, handleItemClick } = useSelection({ allIds: allDeckIds });

  // Filter folders and decks for display at current level
  const displayFolders = currentFolderId ? [] : folders;
  const totalItems = displayFolders.length + decks.length;

  // Calculate columns based on grid width (cv-5-5 AC-39)
  useEffect(() => {
    if (!gridRef.current || viewMode !== 'grid') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Each card is min 240px, calculate how many fit
        const cols = Math.max(1, Math.floor(entry.contentRect.width / 264)); // 240 + 24 gap
        setColumns(cols);
      }
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

  // cv-5-5 AC-39: Grid keyboard navigation
  const handleGridActivate = useCallback((index: number) => {
    // Handle folder activation first
    if (index < displayFolders.length) {
      onFolderClick(displayFolders[index].id);
    } else {
      // Handle deck activation
      const deckIndex = index - displayFolders.length;
      if (deckIndex < decks.length) {
        onDeckClick(decks[deckIndex].id);
      }
    }
  }, [displayFolders, decks, onFolderClick, onDeckClick]);

  const {
    focusedIndex,
    handleKeyDown: handleGridKeyDown,
    getTabIndex,
    containerRef: keyboardContainerRef,
  } = useGridKeyboard({
    itemCount: totalItems,
    columns,
    onActivate: handleGridActivate,
    disabled: viewMode !== 'grid',
  });

  // Merge refs for the grid container
  const setGridRef = useCallback((node: HTMLDivElement | null) => {
    gridRef.current = node;
    if (keyboardContainerRef) {
      (keyboardContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [keyboardContainerRef]);

  // Configure sensors for drag-and-drop (cv-3-3 AC-22)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDeckClick = useCallback(
    (deckId: string) => {
      onDeckClick(deckId);
    },
    [onDeckClick],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const id = active.id as string;
      if (id.startsWith('deck-')) {
        const deckId = id.replace('deck-', '');
        const deck = decks.find((d) => d.id === deckId);
        if (deck) {
          setActiveId(id);
          setActiveDeck(deck);
        }
      }
    },
    [decks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveDeck(null);

      if (!over || !active) return;

      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;

      // Only handle deck-to-folder drops
      if (activeIdStr.startsWith('deck-') && overIdStr.startsWith('folder-')) {
        const deckId = activeIdStr.replace('deck-', '');
        const folderId = overIdStr.replace('folder-', '');
        onMoveDeck?.(deckId, folderId);
      }
    },
    [onMoveDeck],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveDeck(null);
  }, []);

  if (viewMode === 'list') {
    return (
      <div className="deck-list" role="list">
        {/* Folders first (only at root level) */}
        {displayFolders.map((folder) => (
          <div
            key={`folder-${folder.id}`}
            className="deck-list__row deck-list__row--folder"
            role="listitem"
            tabIndex={0}
            onClick={() => onFolderClick(folder.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onFolderClick(folder.id);
              }
            }}
            aria-label={`Folder: ${folder.name}, ${folder.deckCount} decks`}
          >
            <span className="deck-list__name deck-list__name--folder">📁 {folder.name}</span>
            <span className="deck-list__count">{folder.deckCount} decks</span>
            <span className="deck-list__modified">{formatRelativeTime(folder.lastModified)}</span>
          </div>
        ))}
        {/* Decks */}
        {decks.map((deck) => {
          const slideLabel = `${deck.slideCount} slide${deck.slideCount !== 1 ? 's' : ''}`;
          return (
            <div
              key={deck.id}
              className="deck-list__row"
              role="listitem"
              tabIndex={0}
              onClick={() => handleDeckClick(deck.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDeckClick(deck.id);
                }
              }}
              aria-label={`Deck: ${deck.name}, ${slideLabel}, status: ${deck.status}`}
            >
              <span className="deck-list__name">{deck.name}</span>
              <span className="deck-list__count">{slideLabel}</span>
              <StatusDot status={deck.status} />
              <span className="deck-list__modified">{formatRelativeTime(deck.lastModified)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={setGridRef}
        className="deck-grid"
        role="grid"
        aria-label="Deck grid"
        onKeyDown={handleGridKeyDown}
      >
        {/* Folders first (only at root level) */}
        {displayFolders.map((folder, index) => (
          <div
            key={`folder-${folder.id}`}
            role="gridcell"
            tabIndex={getTabIndex(index)}
            data-focused={focusedIndex === index}
          >
            <FolderCard
              folder={folder}
              onClick={onFolderClick}
              onRename={onFolderRename}
              onDelete={onFolderDelete}
            />
          </div>
        ))}
        {/* Decks */}
        {decks.map((deck, index) => {
          const gridIndex = displayFolders.length + index;
          return (
            <div
              key={deck.id}
              role="gridcell"
              tabIndex={getTabIndex(gridIndex)}
              data-focused={focusedIndex === gridIndex}
            >
              <DeckCard
                deck={deck}
                onClick={handleDeckClick}
                onEditPlan={onEditPlan}
                onDuplicate={onDuplicate}
                onRename={handleRenameRequest}
                onDelete={onDelete}
                isDraggable
                isSelected={isSelected(deck.id)}
                onSelectionClick={handleItemClick}
              />
            </div>
          );
        })}
      </div>

      {/* Drag overlay for deck being dragged */}
      <DragOverlay>
        {activeDeck && (
          <div className="deck-card-drag-overlay">
            <DeckCard
              deck={activeDeck}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>

      {/* rename-deck-2 AC-2: Rename dialog */}
      {renameDeck && (
        <RenameDeckDialog
          open={renameDeck !== null}
          onOpenChange={(open) => { if (!open) setRenameDeck(null); }}
          deck={renameDeck}
          existingDeckIds={existingDeckIds}
        />
      )}
    </DndContext>
  );
}
