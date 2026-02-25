/**
 * InlineNameEdit - Inline text input for renaming folders.
 * Saves on blur or Enter, cancels on Escape.
 *
 * Story Reference: cv-3-3 AC-21
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';

export interface InlineNameEditProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export function InlineNameEdit({
  initialValue,
  onSave,
  onCancel,
  autoFocus = false,
}: InlineNameEditProps): React.ReactElement {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed) {
          onSave(trimmed);
        } else {
          onCancel();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [value, onSave, onCancel],
  );

  const handleBlur = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  }, [value, onSave, onCancel]);

  // Prevent click from propagating to parent card
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <input
      ref={inputRef}
      className="inline-name-edit"
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={handleClick}
      aria-label="Folder name"
    />
  );
}
