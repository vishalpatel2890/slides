/**
 * InlineEditText - Click-to-edit text component.
 *
 * Story Reference: cv-4-5 AC-35, AC-36
 *
 * AC-35: Clicking display name text makes it an inline editable field (saves on blur/Enter)
 * AC-36: Clicking description text makes it an inline editable field (same pattern)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface InlineEditTextProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  as?: 'h2' | 'p' | 'span';
  ariaLabel?: string;
  multiline?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function InlineEditText({
  value,
  onSave,
  placeholder = 'Click to edit',
  className = '',
  as: Tag = 'span',
  ariaLabel,
  multiline = false,
}: InlineEditTextProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync editValue when value prop changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(true);
  }, [value]);

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    },
    [handleSave, handleCancel, multiline],
  );

  if (isEditing) {
    const commonProps = {
      className: `inline-edit-text__input ${className}`.trim(),
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      'aria-label': ariaLabel,
    };

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          {...commonProps}
          rows={3}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        {...commonProps}
      />
    );
  }

  return (
    <Tag
      className={`inline-edit-text ${className}${!value ? ' inline-edit-text--placeholder' : ''}`}
      onClick={handleStartEdit}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartEdit();
        }
      }}
      aria-label={ariaLabel ? `${ariaLabel} (click to edit)` : 'Click to edit'}
    >
      {value || placeholder}
    </Tag>
  );
}
