/**
 * DeleteConfirmDialog - Radix Dialog confirmation for slide deletion.
 *
 * Story Reference: 21-1 Task 5 - DeleteConfirmDialog component
 * Architecture Reference: notes/ux-design/ux-design-specification.md#Dialog Patterns
 *
 * AC-21.1.6: "Delete slide {N}?" with intent preview
 * AC-21.1.7: Cancel button auto-focused (safe default)
 * AC-21.1.8: Dismissable via click outside, Escape, Cancel
 */

import React, { useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';

// =============================================================================
// Props Interface
// =============================================================================

export interface DeleteConfirmDialogProps {
  open: boolean;
  slideNumber: number;
  slideIntent: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function DeleteConfirmDialog({
  open,
  slideNumber,
  slideIntent,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps): React.ReactElement {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // AC-21.1.7: Auto-focus Cancel button when dialog opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        cancelRef.current?.focus();
      });
    }
  }, [open]);

  // Truncate intent preview to ~100 chars
  const preview = slideIntent.length > 100
    ? slideIntent.slice(0, 100) + '...'
    : slideIntent;

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/40 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50',
            '-translate-x-1/2 -translate-y-1/2',
            'w-[90vw] max-w-sm',
            'bg-[var(--card)] border border-[var(--border)]',
            'rounded-lg shadow-xl',
            'p-6',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
          // Prevent Radix from auto-focusing the first focusable element (which would be Cancel anyway)
          // We handle focus manually to ensure Cancel gets focus
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Title className="text-[14px] font-semibold text-[var(--fg)]">
            Delete slide {slideNumber}?
          </Dialog.Title>

          {preview && (
            <Dialog.Description className="mt-2 text-[13px] text-[var(--fg-muted)] leading-relaxed">
              {preview}
            </Dialog.Description>
          )}

          <div className="flex justify-end gap-3 mt-6">
            {/* AC-21.1.7: Cancel is auto-focused (safe default for destructive action) */}
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className={cn(
                'px-4 py-2 rounded-md',
                'text-[13px] font-medium text-[var(--fg-secondary)]',
                'bg-[var(--surface)] hover:bg-[var(--bg)]',
                'border border-[var(--border)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
                'transition-colors duration-150'
              )}
            >
              Cancel
            </button>

            {/* AC-21.1.6: Destructive style inside dialog only (UX spec) */}
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'px-4 py-2 rounded-md',
                'text-[13px] font-medium text-white',
                'bg-[#ef4444] hover:bg-[#dc2626]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4444] focus-visible:ring-offset-2',
                'transition-colors duration-150'
              )}
            >
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
