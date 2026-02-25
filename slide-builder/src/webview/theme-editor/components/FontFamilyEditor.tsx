/**
 * FontFamilyEditor - Text input with live font preview and availability detection.
 *
 * Story Reference: bt-3-2 Task 1 -- AC-11, AC-12, AC-13
 * Renders a text input for font family value using DirtyTextInput wrapper,
 * sample preview text rendered with CSS font-family, and font availability
 * detection via document.fonts.check().
 *
 * Constraints:
 * - No CSS imports; inline styles + VS Code CSS custom properties only
 * - Composes DirtyTextInput internally for dirty state tracking
 * - document.fonts.check() is best-effort; wrapped in try/catch
 */

import React, { useState, useEffect } from 'react';
import { DirtyTextInput } from './PropertyInput';

// =============================================================================
// Props
// =============================================================================

export interface FontFamilyEditorProps {
  /** Display label for the font property (e.g., "Heading", "Body", "Mono") */
  label: string;
  /** Current font family value (e.g., "Inter", "Georgia") */
  value: string;
  /** Dot-notation path for UPDATE_VALUE dispatch (e.g., "typography.fonts.heading") */
  path: string;
  /** Called when font family changes: (path, newValue) */
  onUpdate: (path: string, value: string) => void;
}

// =============================================================================
// Styles
// =============================================================================

const previewStyle: React.CSSProperties = {
  color: 'var(--vscode-editor-foreground, #cccccc)',
  padding: '8px',
  marginTop: '4px',
  borderRadius: '4px',
  background: 'var(--vscode-input-background, #3c3c3c)',
  border: '1px solid var(--vscode-panel-border, #333333)',
  lineHeight: 1.4,
};

const indicatorStyle: React.CSSProperties = {
  color: 'var(--vscode-editorWarning-foreground, #cca700)',
  fontSize: '11px',
  opacity: 0.8,
  marginTop: '2px',
};

// =============================================================================
// Font Availability Detection
// =============================================================================

/**
 * Best-effort font availability check using document.fonts.check().
 * Returns null if the API is unavailable (graceful degradation).
 */
function checkFontAvailability(fontFamily: string): boolean | null {
  if (!fontFamily || fontFamily.trim() === '') return null;
  try {
    if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.check === 'function') {
      return document.fonts.check(`16px "${fontFamily}"`);
    }
  } catch {
    // API unavailable or error — graceful degradation
  }
  return null;
}

// =============================================================================
// Component
// =============================================================================

const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';

export function FontFamilyEditor({
  label,
  value,
  path,
  onUpdate,
}: FontFamilyEditorProps): React.JSX.Element {
  const [fontAvailable, setFontAvailable] = useState<boolean | null>(null);

  // Check font availability on mount and value change
  useEffect(() => {
    const result = checkFontAvailability(value);
    setFontAvailable(result);
  }, [value]);

  return (
    <div data-testid={`font-family-editor-${path}`} className="mb-3">
      {/* Text input for font family value */}
      <DirtyTextInput
        label={label}
        value={value}
        path={path}
        onUpdate={onUpdate}
      />

      {/* Live font preview */}
      <div
        data-testid={`font-preview-${path}`}
        style={{
          ...previewStyle,
          fontFamily: `"${value}", sans-serif`,
          fontSize: '14px',
        }}
      >
        {PREVIEW_TEXT}
      </div>

      {/* Font availability indicator (AC-13) */}
      {fontAvailable === false && (
        <div
          data-testid={`font-unavailable-${path}`}
          style={indicatorStyle}
        >
          (font may not be available locally)
        </div>
      )}
    </div>
  );
}
