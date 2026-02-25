/**
 * SlideInstructionEditor - Inline editor for slide instructions within a deck template.
 *
 * Story Reference: v4-1-4 AC-1, AC-2, AC-3, AC-4, AC-5
 *
 * AC-1: Opens inline when "Edit" is clicked on a slide row
 * AC-2: Multiline textarea with placeholder syntax highlighting preview
 * AC-3: "Save" persists changes via callback
 * AC-4: "Preview Placeholders" section shows extracted placeholders
 * AC-5: Inline validation for placeholder syntax
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export interface SlideInstructionEditorProps {
  /** Current instruction text */
  instructions: string;
  /** Slide number (for display) */
  slideNumber: number;
  /** Slide name (for display) */
  slideName: string;
  /** Callback to save updated instructions */
  onSave: (instructions: string) => void;
  /** Callback to cancel editing */
  onCancel: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** Regex to match placeholder patterns like {variable_name} */
const PLACEHOLDER_REGEX = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/** Regex to detect malformed placeholders (unclosed, invalid chars) */
const MALFORMED_REGEX = /\{([^}]*[^a-zA-Z0-9_}][^}]*)\}|\{([a-zA-Z_][a-zA-Z0-9_]*)$|\{$/gm;

/**
 * Extract valid placeholder names from instruction text.
 */
function extractPlaceholders(text: string): string[] {
  const matches = new Set<string>();
  let match;
  const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

/**
 * Find malformed placeholder patterns for validation.
 */
function findValidationErrors(text: string): string[] {
  const errors: string[] = [];

  // Check for unclosed braces
  let openCount = 0;
  for (const char of text) {
    if (char === '{') openCount++;
    if (char === '}') openCount--;
  }
  if (openCount > 0) {
    errors.push('Unclosed placeholder brace detected');
  }

  // Check for invalid characters inside braces
  const malformedRegex = /\{([^}]*[^a-zA-Z0-9_}][^}]*)\}/g;
  let match;
  while ((match = malformedRegex.exec(text)) !== null) {
    errors.push(`Invalid placeholder: {${match[1]}}`);
  }

  return errors;
}

// =============================================================================
// Component
// =============================================================================

export function SlideInstructionEditor({
  instructions,
  slideNumber,
  slideName,
  onSave,
  onCancel,
}: SlideInstructionEditorProps): React.ReactElement {
  const [value, setValue] = useState(instructions);
  const isDirty = value !== instructions;

  // Extract placeholders from current text (AC-4)
  const placeholders = useMemo(() => extractPlaceholders(value), [value]);

  // Validate placeholder syntax (AC-5)
  const validationErrors = useMemo(() => findValidationErrors(value), [value]);

  // Handle save (AC-3)
  const handleSave = useCallback(() => {
    onSave(value);
  }, [value, onSave]);

  // Handle keyboard shortcut
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [handleSave, onCancel],
  );

  return (
    <div className="slide-instruction-editor" role="region" aria-label={`Edit instructions for ${slideName}`}>
      {/* Header */}
      <div className="slide-instruction-editor__header">
        <span className="slide-instruction-editor__title">
          Editing Slide {slideNumber}: {slideName}
        </span>
        <div className="slide-instruction-editor__actions">
          <button
            type="button"
            className="slide-instruction-editor__btn slide-instruction-editor__btn--save"
            onClick={handleSave}
            disabled={!isDirty}
            aria-label="Save instructions"
          >
            <Save size={14} />
            Save
          </button>
          <button
            type="button"
            className="slide-instruction-editor__btn slide-instruction-editor__btn--cancel"
            onClick={onCancel}
            aria-label="Cancel editing"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>

      {/* Textarea (AC-2) */}
      <textarea
        className="slide-instruction-editor__textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={8}
        placeholder="Enter instructions for this slide..."
        aria-label="Slide instructions"
      />

      {/* Validation errors (AC-5) */}
      {validationErrors.length > 0 && (
        <div className="slide-instruction-editor__errors" role="alert">
          {validationErrors.map((error, i) => (
            <div key={i} className="slide-instruction-editor__error">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder preview (AC-4) */}
      {placeholders.length > 0 && (
        <div className="slide-instruction-editor__placeholders">
          <span className="slide-instruction-editor__placeholders-title">
            Placeholders ({placeholders.length})
          </span>
          <div className="slide-instruction-editor__placeholder-list">
            {placeholders.map((name) => (
              <span key={name} className="slide-instruction-editor__placeholder-chip">
                {`{${name}}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SlideInstructionEditor;
