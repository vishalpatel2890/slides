/**
 * EditWithClaudeDialog - Radix Dialog modal for capturing Claude edit instructions.
 *
 * Story Reference: story-claude-edit-modal-1
 *
 * AC #1: Centered modal with overlay using Radix Dialog Portal
 * AC #2: Title reads "Edit Plan with Claude" when slideNumber is null
 * AC #3: Title reads "Edit Slide {N} with Claude" when slideNumber is provided
 * AC #4: Textarea auto-focuses on open
 * AC #5: Enter submits, Shift+Enter inserts newline
 * AC #6: Escape or Cancel button calls onCancel
 * AC #7: Submit button disabled when textarea is empty/whitespace
 * AC #8: Textarea clears on reopen
 * AC #9: Passes axe accessibility audit
 */

import React, { useRef, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Sparkles, Send, X } from 'lucide-react';
import { cn } from '../lib/utils';

// =============================================================================
// Props Interface
// =============================================================================

export interface EditWithClaudeDialogProps {
  open: boolean;
  slideNumber: number | null;
  onSubmit: (instruction: string) => void;
  onCancel: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function EditWithClaudeDialog({
  open,
  slideNumber,
  onSubmit,
  onCancel,
}: EditWithClaudeDialogProps): React.ReactElement {
  const [instruction, setInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AC #4: Auto-focus textarea when dialog opens
  // AC #8: Clear textarea when dialog closes
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    } else {
      setInstruction('');
    }
  }, [open]);

  // AC #2, #3: Dynamic title based on slideNumber
  const title = slideNumber === null
    ? 'Edit Plan with Claude'
    : `Edit Slide ${slideNumber} with Claude`;

  const trimmedInstruction = instruction.trim();
  const isSubmitDisabled = trimmedInstruction.length === 0;

  function handleSubmit() {
    if (isSubmitDisabled) return;
    onSubmit(trimmedInstruction);
  }

  // AC #5: Enter submits, Shift+Enter for newline
  // AC #6: Escape closes (Radix handles this natively too)
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

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
            'w-[90vw] max-w-md',
            'bg-[var(--card)] border border-[var(--border)]',
            'rounded-lg shadow-xl',
            'p-6',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
        >
          {/* Header with icon and close button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--primary)]" />
              <Dialog.Title className="text-[14px] font-semibold text-[var(--fg)]">
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className={cn(
                  'p-1 rounded-md',
                  'text-[var(--fg-muted)] hover:text-[var(--fg)]',
                  'hover:bg-[var(--surface)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
                  'transition-colors duration-150'
                )}
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            placeholder="Describe what you'd like to change..."
            className={cn(
              'w-full resize-y',
              'bg-[var(--surface)] text-[var(--fg)]',
              'border border-[var(--border)] rounded-md',
              'px-3 py-2 text-[13px]',
              'placeholder:text-[var(--fg-muted)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent',
              'transition-colors duration-150'
            )}
          />

          {/* Footer with Cancel and Submit */}
          <div className="flex justify-end gap-3 mt-4">
            <button
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

            {/* AC #7: Submit disabled when textarea empty/whitespace */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={cn(
                'flex items-center gap-2',
                'px-4 py-2 rounded-md',
                'text-[13px] font-medium',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2',
                'transition-colors duration-150',
                isSubmitDisabled
                  ? 'bg-[var(--surface)] text-[var(--fg-muted)] cursor-not-allowed border border-[var(--border)]'
                  : 'bg-[var(--primary)] text-white hover:opacity-90'
              )}
            >
              <Send size={14} />
              Submit
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
