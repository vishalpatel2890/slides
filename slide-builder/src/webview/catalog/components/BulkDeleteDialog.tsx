/**
 * BulkDeleteDialog - Confirmation dialog for bulk delete operations.
 *
 * Story Reference: cv-5-4 Task 7 — BulkDeleteDialog component
 * AC-30: "Delete {n} selected items? This cannot be undone." with [Cancel] [Delete {n}] buttons
 *
 * Uses Radix Dialog with role="alertdialog" and auto-focuses Cancel button (safe default).
 */

import React, { useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export type BulkDeleteItemType = 'decks' | 'assets' | 'slides';

export interface BulkDeleteDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the open state should change */
  onOpenChange: (open: boolean) => void;
  /** Number of items to be deleted */
  count: number;
  /** Type of items being deleted */
  itemType: BulkDeleteItemType;
  /** Called when the user confirms the delete */
  onConfirm: () => void;
}

/**
 * Get the display label for item type.
 */
function getItemLabel(itemType: BulkDeleteItemType, count: number): string {
  const labels: Record<BulkDeleteItemType, { singular: string; plural: string }> = {
    decks: { singular: 'deck', plural: 'decks' },
    assets: { singular: 'asset', plural: 'assets' },
    slides: { singular: 'slide', plural: 'slides' },
  };
  const label = labels[itemType];
  return count === 1 ? label.singular : label.plural;
}

/**
 * BulkDeleteDialog - Confirmation dialog for bulk delete operations.
 *
 * @example
 * ```tsx
 * <BulkDeleteDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   count={selectedIds.size}
 *   itemType="decks"
 *   onConfirm={handleBulkDelete}
 * />
 * ```
 */
export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  itemType,
  onConfirm,
}: BulkDeleteDialogProps): React.ReactElement {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // AC-30: Auto-focus Cancel button when dialog opens (safe default)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  const itemLabel = getItemLabel(itemType, count);
  const title = `Delete ${count} selected ${itemLabel}?`;
  const description = 'This cannot be undone.';

  const handleConfirm = (): void => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-dialog-overlay" />
        <Dialog.Content
          className="confirm-dialog-content"
          role="alertdialog"
          aria-describedby="bulk-delete-dialog-description"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="confirm-dialog-title">{title}</Dialog.Title>
          <Dialog.Description
            id="bulk-delete-dialog-description"
            className="confirm-dialog-description"
          >
            {description}
          </Dialog.Description>
          <div className="confirm-dialog-actions">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => onOpenChange(false)}
              className="confirm-dialog-btn confirm-dialog-btn--secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="confirm-dialog-btn confirm-dialog-btn--destructive"
            >
              Delete {count}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default BulkDeleteDialog;
