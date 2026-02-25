import React, { useRef, useEffect, useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

/**
 * Props for the EditWithAiModal component.
 * ae-1-1 AC-4,5,6,7,8,9: Bottom-anchored modal for AI edit instructions.
 */
export interface EditWithAiModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current slide number (1-based) */
  slideNumber: number;
  /** Called with the instruction text when user submits */
  onSubmit: (instruction: string) => void;
  /** Called when user dismisses the modal */
  onClose: () => void;
  /** Optional custom title (defaults to "Edit with AI") */
  title?: string;
  /** Optional custom placeholder text */
  placeholder?: string;
  /** When true, submit button enabled even with empty text (story-1.2 AC-4) */
  allowEmpty?: boolean;
  /** When true, submit button shows spinner and is disabled (story-1.2 AC-3,4) */
  inFlight?: boolean;
}

/**
 * Bottom-anchored modal overlay for entering natural language AI edit instructions.
 * ae-1-1 AC-4: Opens at bottom ~35% height, keeping slide visible above.
 * ae-1-1 AC-5: Textarea auto-focuses on open.
 * ae-1-1 AC-6: Enter submits, Shift+Enter for newline.
 * ae-1-1 AC-7: Escape or X button closes.
 * ae-1-1 AC-8: Submit disabled when empty.
 * ae-1-1 AC-9: Modal closes on successful submission.
 */
export function EditWithAiModal({
  visible,
  slideNumber,
  onSubmit,
  onClose,
  title = 'Edit with AI',
  placeholder = 'Describe a layout change... (e.g., make two columns, move image right)',
  allowEmpty = false,
  inFlight = false,
}: EditWithAiModalProps): React.ReactElement | null {
  const [instruction, setInstruction] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevVisibleRef = useRef(visible);

  // ae-1-1 AC-5: Auto-focus textarea when modal becomes visible
  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  // story-1.2 AC-5,6: Clear instruction only when modal is explicitly closed (visible transitions true→false)
  useEffect(() => {
    if (prevVisibleRef.current && !visible) {
      setInstruction('');
    }
    prevVisibleRef.current = visible;
  }, [visible]);

  if (!visible) {
    return null;
  }

  const trimmedInstruction = instruction.trim();
  const isSubmitDisabled = inFlight || (!allowEmpty && trimmedInstruction.length === 0);

  function handleSubmit() {
    if (isSubmitDisabled) return;
    onSubmit(trimmedInstruction);
  }

  // ae-1-1 AC-6: Enter submits, Shift+Enter for newline
  // ae-1-1 AC-7: Escape closes
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Shift+Enter: default behavior (newline) is preserved
  }

  return (
    <div
      data-testid="edit-with-ai-modal"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '35%',
        minHeight: '180px',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        borderTop: '1px solid var(--vscode-panel-border, #444)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--vscode-panel-border, #333)',
        }}
      >
        <span
          style={{
            color: 'var(--vscode-foreground, #ccc)',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {title} — Slide {slideNumber}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-testid="edit-modal-close"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vscode-foreground, #ccc)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Textarea */}
      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
        <textarea
          ref={inputRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          data-testid="edit-modal-textarea"
          style={{
            flex: 1,
            resize: 'none',
            backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
            color: 'var(--vscode-input-foreground, #ccc)',
            border: '1px solid var(--vscode-input-border, #555)',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '13px',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>

      {/* Footer with Submit button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '8px 12px',
          borderTop: '1px solid var(--vscode-panel-border, #333)',
        }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          data-testid="edit-modal-submit"
          aria-label={inFlight ? 'Animating...' : 'Submit'}
          aria-busy={inFlight || undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px',
            backgroundColor: isSubmitDisabled
              ? 'var(--vscode-button-secondaryBackground, #555)'
              : 'var(--vscode-button-background, #0e639c)',
            color: isSubmitDisabled
              ? 'var(--vscode-disabledForeground, #888)'
              : 'var(--vscode-button-foreground, #fff)',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {inFlight ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Send size={14} />
          )}
          {inFlight ? 'Animating...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
