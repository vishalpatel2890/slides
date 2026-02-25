/**
 * ConfirmDialog - Reusable Radix Dialog for confirmations.
 *
 * Story Reference: cv-3-2 Task 1 — ConfirmDialog component
 * Architecture Reference: notes/ux-design/ux-design-catalog-viewer.md#Confirmation-Patterns
 *
 * AC-4: Delete shows confirmation dialog
 * AC-5: Cancel button auto-focused (safe default for destructive action)
 * AC-6: Dismissible via click outside, Escape key, Cancel button
 */

import React, { useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

// =============================================================================
// Props Interface
// =============================================================================

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

// =============================================================================
// Component
// =============================================================================

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps): React.ReactElement {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // AC-5: Auto-focus Cancel button when dialog opens (safe default)
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* AC-6: Click outside dismisses dialog */}
        <Dialog.Overlay className="confirm-dialog-overlay" />
        <Dialog.Content
          className="confirm-dialog-content"
          role="alertdialog"
          aria-describedby="confirm-dialog-description"
          // Prevent Radix from auto-focusing first element; we handle focus manually
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="confirm-dialog-title">
            {title}
          </Dialog.Title>

          <Dialog.Description
            id="confirm-dialog-description"
            className="confirm-dialog-description"
          >
            {description}
          </Dialog.Description>

          <div className="confirm-dialog-actions">
            {/* AC-5: Cancel is auto-focused (safe default) */}
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
              onClick={handleConfirm}
              className={`confirm-dialog-btn ${
                variant === 'destructive'
                  ? 'confirm-dialog-btn--destructive'
                  : 'confirm-dialog-btn--primary'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
