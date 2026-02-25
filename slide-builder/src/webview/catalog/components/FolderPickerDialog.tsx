/**
 * FolderPickerDialog - Dialog for selecting a target folder to move a deck.
 *
 * Story Reference: cv-3-7 Task 2 — FolderPickerDialog component
 *
 * AC-2: Lists all available folders plus "Root (No Folder)" option.
 * AC-3: Excludes the deck's current folder from the list.
 * AC-5: "Root (No Folder)" moves deck to .slide-builder/decks/ root.
 * AC-8: Keyboard accessible (arrow keys, Enter, Escape).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Folder, Home } from 'lucide-react';
import type { FolderInfo } from '../../../shared/types';
import { useCatalogFolders } from '../context/CatalogContext';
import { useVSCodeApi } from '../../shared/hooks/useVSCodeApi';

// =============================================================================
// Props Interface
// =============================================================================

export interface FolderPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  deckName: string;
  /** The deck's current folder ID (undefined = root) */
  currentFolderId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function FolderPickerDialog({
  open,
  onOpenChange,
  deckId,
  deckName,
  currentFolderId,
}: FolderPickerDialogProps): React.ReactElement {
  const folders = useCatalogFolders();
  const vscodeApi = useVSCodeApi();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Build list of available folders, excluding the current one
  const availableFolders = folders.filter(
    (f: FolderInfo) => f.id !== currentFolderId
  );

  // Show "Root (No Folder)" when deck is currently inside a folder
  const showRootOption = currentFolderId !== undefined;

  // Reset selection and error when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedFolderId(null);
      setError(null);
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  // Listen for error messages from extension
  useEffect(() => {
    if (!open) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'error' && message.context === 'move-deck') {
        setError(message.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleMove = useCallback(() => {
    if (selectedFolderId === null) return;

    setError(null);

    // selectedFolderId === '__root__' means move to root
    const targetFolderId =
      selectedFolderId === '__root__' ? undefined : selectedFolderId;

    vscodeApi.postMessage({
      type: 'move-deck',
      deckId,
      targetFolderId,
    });

    onOpenChange(false);
  }, [selectedFolderId, deckId, vscodeApi, onOpenChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && selectedFolderId !== null) {
        e.preventDefault();
        handleMove();
      }
    },
    [selectedFolderId, handleMove]
  );

  const isSelectionValid = selectedFolderId !== null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-dialog-overlay" />
        <Dialog.Content
          className="confirm-dialog-content folder-picker-content"
          aria-label="Move deck to folder"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="confirm-dialog-title">
            Move &ldquo;{deckName}&rdquo;
          </Dialog.Title>

          <Dialog.Description className="confirm-dialog-description">
            Select a destination folder:
          </Dialog.Description>

          {error && (
            <div className="folder-picker-error" role="alert">
              {error}
            </div>
          )}

          <fieldset
            className="folder-picker-list"
            aria-label="Available folders"
          >
            {/* Root option - shown when deck is inside a folder */}
            {showRootOption && (
              <label
                className={`folder-picker-item ${
                  selectedFolderId === '__root__'
                    ? 'folder-picker-item--selected'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="target-folder"
                  className="folder-picker-item__radio"
                  checked={selectedFolderId === '__root__'}
                  onChange={() => setSelectedFolderId('__root__')}
                />
                <span className="folder-picker-item__radio-dot" />
                <Home size={16} className="folder-picker-item__icon" />
                <span className="folder-picker-item__name">
                  Root (No Folder)
                </span>
              </label>
            )}

            {/* Folder options */}
            {availableFolders.map((folder: FolderInfo) => (
              <label
                key={folder.id}
                className={`folder-picker-item ${
                  selectedFolderId === folder.id
                    ? 'folder-picker-item--selected'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="target-folder"
                  className="folder-picker-item__radio"
                  checked={selectedFolderId === folder.id}
                  onChange={() => setSelectedFolderId(folder.id)}
                />
                <span className="folder-picker-item__radio-dot" />
                <Folder size={16} className="folder-picker-item__icon" />
                <span className="folder-picker-item__name">{folder.name}</span>
                <span className="folder-picker-item__count">
                  {folder.deckCount} deck{folder.deckCount !== 1 ? 's' : ''}
                </span>
              </label>
            ))}

            {/* Empty state */}
            {availableFolders.length === 0 && !showRootOption && (
              <p className="folder-picker-empty">
                No folders available. Create a folder first.
              </p>
            )}
          </fieldset>

          <div className="confirm-dialog-actions">
            <button
              ref={cancelRef}
              type="button"
              onClick={handleCancel}
              className="confirm-dialog-btn confirm-dialog-btn--secondary"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleMove}
              disabled={!isSelectionValid}
              className={`confirm-dialog-btn ${
                isSelectionValid
                  ? 'confirm-dialog-btn--primary'
                  : 'confirm-dialog-btn--disabled'
              }`}
            >
              Move
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
