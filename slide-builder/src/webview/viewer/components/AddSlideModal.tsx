import React, { useRef, useEffect, useState, useMemo } from 'react';
import { X, Send, Loader2, ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

/**
 * Props for the AddSlideModal component.
 * story-viewer-add-slide-1 AC-1,2,3,4,5,6,7: Bottom-anchored modal for Add Slide.
 */
export interface AddSlideModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current slide number (1-based) for default position */
  currentSlide: number;
  /** Total number of slides in the deck */
  totalSlides: number;
  /** Deck display name for the header */
  deckName: string;
  /** Called with position and description when user submits */
  onSubmit: (position: number | 'end', description: string) => void;
  /** Called when user dismisses the modal */
  onClose: () => void;
  /** When true, submit button shows spinner and is disabled (AC-10 in-flight) */
  inFlight?: boolean;
}

/**
 * Bottom-anchored modal for adding a new slide to a deck.
 * story-viewer-add-slide-1 AC-1: Opens at bottom ~35% height, keeping slide visible above.
 * story-viewer-add-slide-1 AC-2: Header, position selector, description textarea, Submit button.
 * story-viewer-add-slide-1 AC-3: Position defaults to "After slide {currentSlide}".
 * story-viewer-add-slide-1 AC-4: Submit disabled when description empty.
 * story-viewer-add-slide-1 AC-5: Submit enabled when description has text.
 * story-viewer-add-slide-1 AC-6: Escape or X closes without submitting.
 * story-viewer-add-slide-1 AC-7: Enter (not Shift+Enter) submits.
 */
export function AddSlideModal({
  visible,
  currentSlide,
  totalSlides,
  deckName,
  onSubmit,
  onClose,
  inFlight = false,
}: AddSlideModalProps): React.ReactElement | null {
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<string>(String(currentSlide));
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevVisibleRef = useRef(false);

  // AC-3: Build position options dynamically based on totalSlides
  const positionOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let i = 1; i <= totalSlides; i++) {
      options.push({ value: String(i), label: `After slide ${i}` });
    }
    options.push({ value: 'end', label: 'At the end' });
    return options;
  }, [totalSlides]);

  // AC-3: Reset position and description when modal opens (visible transitions false→true)
  useEffect(() => {
    if (!prevVisibleRef.current && visible) {
      setPosition(String(currentSlide));
      setDescription('');
    }
    prevVisibleRef.current = visible;
  }, [visible, currentSlide]);

  // AC-5: Auto-focus textarea when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Small delay to let the modal render before focusing
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const trimmedDescription = description.trim();
  // AC-4: Submit disabled when description empty
  const isSubmitDisabled = inFlight || trimmedDescription.length === 0;

  function handleSubmit() {
    if (isSubmitDisabled) return;
    const positionValue = position === 'end' ? 'end' as const : Number(position);
    onSubmit(positionValue, trimmedDescription);
  }

  // AC-7: Enter submits, Shift+Enter for newline
  // AC-6: Escape closes
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      data-testid="add-slide-modal"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '35%',
        minHeight: '220px',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        borderTop: '1px solid var(--vscode-panel-border, #444)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header — AC-2 */}
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
          Add Slide — {deckName}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          data-testid="add-slide-modal-close"
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

      {/* Body: Position selector + Description textarea */}
      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'auto' }}>
        {/* Position selector — AC-3 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            htmlFor="add-slide-position"
            style={{
              color: 'var(--vscode-foreground, #ccc)',
              fontSize: '12px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Position:
          </label>
          <Select.Root value={position} onValueChange={setPosition}>
            <Select.Trigger
              data-testid="add-slide-position-select"
              aria-label="Slide position"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '4px',
                padding: '4px 8px',
                backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
                color: 'var(--vscode-input-foreground, #ccc)',
                border: '1px solid var(--vscode-input-border, #555)',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                minWidth: '160px',
                outline: 'none',
              }}
            >
              <Select.Value placeholder="Select position" />
              <Select.Icon>
                <ChevronDown size={14} />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content
                style={{
                  backgroundColor: 'var(--vscode-dropdown-background, #3c3c3c)',
                  border: '1px solid var(--vscode-dropdown-border, #555)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  zIndex: 1100,
                  overflow: 'hidden',
                }}
                position="popper"
                sideOffset={4}
              >
                <Select.Viewport style={{ padding: '4px' }}>
                  {positionOptions.map((opt) => (
                    <Select.Item
                      key={opt.value}
                      value={opt.value}
                      data-testid={`add-slide-position-option-${opt.value}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 8px',
                        fontSize: '12px',
                        color: 'var(--vscode-dropdown-foreground, #ccc)',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        outline: 'none',
                        userSelect: 'none',
                      }}
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                      <Select.ItemIndicator style={{ marginLeft: 'auto', paddingLeft: '8px' }}>
                        <Check size={12} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Description textarea — AC-2, AC-4, AC-5 */}
        <textarea
          ref={inputRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what this slide should contain..."
          data-testid="add-slide-description"
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

      {/* Footer with Submit button — AC-4, AC-5 */}
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
          data-testid="add-slide-submit"
          aria-label={inFlight ? 'Adding slide...' : 'Submit'}
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
          {inFlight ? 'Adding slide...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
