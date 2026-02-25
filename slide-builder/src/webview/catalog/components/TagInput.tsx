/**
 * TagInput - Chip-input component for tag editing.
 *
 * Story Reference: cv-4-5 AC-37
 * Architecture Reference: ADR-004 - Render-only webview client
 *
 * AC-37: Tags displayed as chip input: type to add new tags (Enter/comma), click x to remove
 */

import React, { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { X } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface TagInputProps {
  /** Current list of tags */
  tags: string[];
  /** Called when tags change */
  onChange: (tags: string[]) => void;
  /** Optional placeholder text */
  placeholder?: string;
  /** Aria label for the input */
  ariaLabel?: string;
}

// =============================================================================
// Component
// =============================================================================

export function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag...',
  ariaLabel = 'Add new tag',
}: TagInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Add a new tag (deduped, trimmed, non-empty)
  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue('');
    },
    [tags, onChange]
  );

  // Remove a tag by index
  const removeTag = useCallback(
    (index: number) => {
      const newTags = tags.filter((_, i) => i !== index);
      onChange(newTags);
    },
    [tags, onChange]
  );

  // Handle key events: Enter or comma to add tag
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
        // Remove last tag on backspace when input is empty
        removeTag(tags.length - 1);
      }
    },
    [inputValue, tags, addTag, removeTag]
  );

  // Handle input change (also catches comma for mobile keyboards)
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If comma is typed, immediately add the tag
    if (value.includes(',')) {
      const parts = value.split(',');
      // Add all parts except the last (which might be partial)
      parts.slice(0, -1).forEach((part) => {
        const trimmed = part.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
          onChange([...tags, trimmed]);
        }
      });
      setInputValue(parts[parts.length - 1]);
    } else {
      setInputValue(value);
    }
  }, [tags, onChange]);

  // Focus input when clicking container
  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      className="tag-input"
      onClick={handleContainerClick}
      role="group"
      aria-label="Tags"
    >
      {/* Existing tags as chips */}
      {tags.map((tag, index) => (
        <span key={`${tag}-${index}`} className="tag-input__chip">
          <span className="tag-input__chip-text">{tag}</span>
          <button
            type="button"
            className="tag-input__chip-remove"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            aria-label={`Remove tag ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}

      {/* Input for new tags */}
      <input
        ref={inputRef}
        type="text"
        className="tag-input__input"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        aria-label={ariaLabel}
      />
    </div>
  );
}

export default TagInput;
