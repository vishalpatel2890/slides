/**
 * RenameDeckDialog - Dialog for renaming a deck's display name and/or directory slug.
 *
 * Story Reference: rename-deck-2 AC-2, AC-3, AC-4, AC-5, AC-6
 *
 * AC-2: Two input fields: Display Name and Directory Slug, pre-filled with current values.
 * AC-3: Real-time validation on slug field via validateDeckSlug().
 * AC-4: Only sends changed fields in rename-deck message.
 * AC-5: Cancel/Escape closes dialog with no changes.
 * AC-6: Closes on successful deck-renamed response.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { DeckInfo } from '../../../shared/types';
import { validateDeckSlug, toSlug } from '../utils/validateDeckName';
import { useVSCodeApi } from '../../shared/hooks/useVSCodeApi';

// =============================================================================
// Props Interface
// =============================================================================

export interface RenameDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: DeckInfo;
  existingDeckIds: string[];
}

// =============================================================================
// Component
// =============================================================================

export function RenameDeckDialog({
  open,
  onOpenChange,
  deck,
  existingDeckIds,
}: RenameDeckDialogProps): React.ReactElement {
  const { postMessage } = useVSCodeApi();
  const [displayName, setDisplayName] = useState(deck.name);
  const [slug, setSlug] = useState(deck.id);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  // rename-deck-2: Track whether user manually edited slug (breaks auto-derive link)
  const slugManuallyEdited = useRef(false);

  // Reset fields when dialog opens or deck changes
  useEffect(() => {
    if (open) {
      setDisplayName(deck.name);
      setSlug(deck.id);
      setSlugError(null);
      setError(null);
      slugManuallyEdited.current = false;
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      });
    }
  }, [open, deck.name, deck.id]);

  // Listen for deck-renamed success and errors from extension
  useEffect(() => {
    if (!open) return;

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'deck-renamed') {
        onOpenChange(false);
      }
      if (message.type === 'error' && message.context === 'rename-deck') {
        setError(message.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, onOpenChange]);

  // rename-deck-2: Auto-derive slug when display name changes (unless manually edited)
  const handleNameChange = useCallback(
    (value: string) => {
      setDisplayName(value);
      if (!slugManuallyEdited.current) {
        const derived = toSlug(value);
        setSlug(derived);
        setSlugError(validateDeckSlug(derived, existingDeckIds, deck.id));
      }
    },
    [existingDeckIds, deck.id],
  );

  // Validate slug on manual change — marks slug as manually edited
  const handleSlugChange = useCallback(
    (value: string) => {
      slugManuallyEdited.current = true;
      setSlug(value);
      const validationError = validateDeckSlug(value, existingDeckIds, deck.id);
      setSlugError(validationError);
    },
    [existingDeckIds, deck.id],
  );

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Determine what changed
  const nameChanged = displayName.trim() !== deck.name;
  const slugChanged = slug.trim() !== deck.id;
  const isDisplayNameEmpty = displayName.trim().length === 0;
  const isDisabled = isDisplayNameEmpty || slugError !== null || (!nameChanged && !slugChanged);

  const handleSubmit = useCallback(() => {
    if (isDisabled) return;

    setError(null);

    const message: { type: 'rename-deck'; deckId: string; newName?: string; newSlug?: string } = {
      type: 'rename-deck',
      deckId: deck.id,
    };

    // rename-deck-2 AC-4: Only include changed fields
    if (nameChanged) {
      message.newName = displayName.trim();
    }
    if (slugChanged) {
      message.newSlug = slug.trim();
    }

    postMessage(message);
  }, [isDisabled, deck.id, nameChanged, slugChanged, displayName, slug, postMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isDisabled) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [isDisabled, handleSubmit],
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-dialog-overlay" />
        <Dialog.Content
          className="confirm-dialog-content rename-deck-content"
          aria-label="Rename deck"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="confirm-dialog-title">
            Rename Deck
          </Dialog.Title>

          <Dialog.Description className="confirm-dialog-description">
            Change the display name and/or directory slug.
          </Dialog.Description>

          {error && (
            <div className="rename-deck-error" role="alert">
              {error}
            </div>
          )}

          <div className="rename-deck-fields">
            {/* Display Name field */}
            <div className="rename-deck-field">
              <label className="rename-deck-label" htmlFor="rename-display-name">
                Display Name
              </label>
              <input
                ref={nameInputRef}
                id="rename-display-name"
                type="text"
                className="rename-deck-input"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            {/* Directory Slug field */}
            <div className="rename-deck-field">
              <label className="rename-deck-label" htmlFor="rename-slug">
                Directory Slug
              </label>
              <input
                id="rename-slug"
                type="text"
                className={`rename-deck-input${slugError ? ' rename-deck-input--error' : ''}`}
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                aria-describedby={slugError ? 'rename-slug-error' : 'rename-slug-warning'}
                aria-invalid={slugError ? true : undefined}
              />
              {slugError ? (
                <p id="rename-slug-error" className="rename-deck-validation-error" role="alert">
                  {slugError}
                </p>
              ) : (
                <p id="rename-slug-warning" className="rename-deck-warning">
                  Changing the directory name will update all references
                </p>
              )}
            </div>
          </div>

          <div className="confirm-dialog-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="confirm-dialog-btn confirm-dialog-btn--secondary"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isDisabled}
              className={`confirm-dialog-btn ${
                isDisabled
                  ? 'confirm-dialog-btn--disabled'
                  : 'confirm-dialog-btn--primary'
              }`}
            >
              Rename
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
